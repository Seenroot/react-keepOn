/* eslint-disable compat/compat */
import axios from 'axios';
import { Modal } from 'antd';
import router from 'umi/router';
import messageTip from './messageTip';
import getBaseUrl from './getBaseUrl';
import storage from './storage';

let hasModal = false;

/**
 * 跳转登录页
 * 携带当前页面路由，以期在登录页面完成登录后返回当前页面
 */
const toLogin = () => {
  router.push({
    pathname: '/login',
    query: {
      redirect: router.currentRoute.fullPath,
    },
  });
};

/**
 * 请求失败后的错误统一处理
 * @param {Number} status 请求失败的状态码
 */
const errorHandle = (status, other) => {
  // 状态码判断
  switch (status) {
    // 401: 未登录状态，跳转登录页
    case 401:
      toLogin();
      break;
    // 403 token过期
    // 清除token并跳转登录页
    case 403:
      messageTip({ type: 'error', content: '登录过期，请重新登录' });
      localStorage.removeItem('token');
      // store.commit('loginSuccess', null);
      setTimeout(() => {
        toLogin();
      }, 1000);
      break;
    // 404请求不存在
    case 404:
      messageTip({ type: 'error', content: '请求的资源不存在' });
      break;
    default:
      console.log(other);
  }
};

// 创建axios实例
const service = axios.create({
  // api的base_url(根据环境)
  baseURL: getBaseUrl(),
  responseType: 'json',
  // 定义对于给定的HTTP 响应状态码是 resolve 或 reject  promise
  // 大于等于200 小于300 通过校验 resolve
  validateStatus(status) {
    return status >= 200 && status < 300; // 默认的
  },
  timeout: 6000, //  超时
});

/**
 * 请求拦截器
 * 每次请求前，如果存在token则在请求头中携带token
 */

service.interceptors.request.use(
  config => {
    // 登录流程控制中，根据本地是否存在token判断用户的登录情况
    // 但是即使token存在，也有可能token是过期的，所以在每次的请求头中携带token
    // 后台根据携带的token判断用户的登录情况，并返回给我们对应的状态码
    // 而后我们可以在响应拦截器中，根据状态码进行一些统一的操作。
    // const token = store.state.token;
    // token && (config.headers.Authorization = token);
    return config;
  },
  error => {
    // do something with request error
    console.log(error); // for debug
    Promise.error(error);
  },
);

// 响应拦截器
service.interceptors.response.use(
  // 请求成功
  res => (res.status === 200 ? Promise.resolve(res) : Promise.reject(res)),
  // 请求失败
  error => {
    const { response } = error;
    if (response) {
      // 请求已发出，但是不在2xx的范围
      errorHandle(response.status, response.data.message);
      return Promise.reject(response);
    }
    return Promise.reject(error);
  },
);

/**
 * 对返回结果进行统一处理 不在页面中处理
 * @param resData 接口返回的数据
 * @param needAlert 是否需要弹框或额外处理
 * @returns {Number | Object} 页面中可以通过返回的数据类型进行逻辑处理，若为Number，直接返回不做处理
 */
function handleResData(resData, url, needAlert) {
  let needAlertInner = needAlert
  const { data: { status } } = resData;
  const token = storage.getItem('token');
  // 根据token判断，除了登录接口和分享页面接口外，没有登录的情况不报错，直接重定向到登录页
  const urlWhiteList = ['/daas/user/login', '/daas/auth/user/login', '/bi/share'];
  if (!token && urlWhiteList.indexOf(url) === -1) {
    return status;
  }
  if (status !== 200) {
    if (status === 401) {
      if (needAlertInner && !hasModal) {
        Modal.info({
          content: '您还未登录，请点击确定去登录',
          okText: '确定',
          onOk: () => {
            // window.location.hash = '#/user/login'
            // 退出登录，初始化redux数据 和 清空storage中的数据
            window.location.href = '/#/user/login';
            storage.clear();
          },
        });
        needAlertInner = false;
        hasModal = !hasModal;
      }
      return status;
    }
    if (status === 402) {
      if (needAlertInner && !hasModal) {
        Modal.info({
          content: '已过登录时效，请点击确定重新登录',
          okText: '确定',
          onOk: () => {
            // window.location.hash = '#/user/login'
            // 退出登录，初始化redux数据 和 清空storage中的数据
            window.location.href = '/#/user/login';
            storage.clear();
          },
        });
        needAlertInner = false;
        hasModal = !hasModal;
      }
      return status;
    }
    if (needAlert) {
      messageTip({ type: 'error', content: resData.data });
    }
    // 返回code 数值类型
    return status;
  }
  // 返回请求返回的数据 对象类型
  return resData;
}

/**
 * @description 这种是请求的错误，并非业务上的错误，业务上的错误需要在处理返回数据中处理，即handleResData
 * @param {Object} error 接口错误对像
 * @param {String} url 请求报错的接口的path 帮助定位错误接口
 */
function handleError(error, url, needAlert) {
  console.warn('error.config at', error.config, url);

  if (needAlert) {
    if (error.response) {
      // 请求已发出，但服务器响应的状态码不在 2xx 范围内
      messageTip({ type: 'error', content: `网络请求错误（状态码为：${error.response.status}）` });
      // 返回网络请求错误的状态码(number)，以便这个接口错误判断处理(typeof res === 'number'错误)
      return error.response.status;
    }
    // Something happened in setting up the request that triggered an Error

    // 返回特殊数字-1，便于错误逻辑处理 对应上面的数值类型
    // message.error('Error at: ' + url + '    message: ' + error.message)
    // messageTip({ type: 'error', content: `请求超时，请检查网络` })
    if (error.code === 'ECONNABORTED' && error.message.indexOf('timeout') !== -1) {
      messageTip({ type: 'error', content: `请求超时，请稍后重试` });
    }
    messageTip({ type: 'error', content: error.message });
    return -1;
  }
  return -1;
}

const request = {
  get(url, reqData, { needAlert = true, timeout = 6000, baseURL = getBaseUrl() } = {}) {
    return service
      .get(url, {
        params: reqData,
        timeout,
        baseURL,
      })
      .then(resData => {
        return handleResData(resData, url, needAlert);
      })
      .catch(error => {
        return handleError(error, url, needAlert);
      });
  },
};

export default request;
