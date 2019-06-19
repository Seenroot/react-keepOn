// @表示src根路径
import request from '@/utils/request';

export async function query(): Promise<any> {
  return request('/api/users');
}

export async function queryCurrent(): Promise<any> {
  return request('http://localhost:8887/question/41');
}

export async function queryNotices(): Promise<any> {
  return request('/api/notices');
}
