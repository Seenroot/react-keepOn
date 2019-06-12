import _ from 'lodash'
import {
  message
} from 'antd'

const messageList = []

export default function ({
  type = 'error',
  content = '',
  duration = 3,
  onClose = null,
  top = '24px',
  timeStamp = +new Date()
}) {
  const messageItem = _.findLast(messageList, item => {
    return item.content === content
  })

  if (messageItem) {
    // 相同的错误提示信息，一定时间内，只能报错一次
    if (timeStamp - messageItem.timeStamp <= 3500) {
      return
    }
  }

  // 错误提示信息
  if (onClose) {
    message[type](content, duration, onClose)
  } else {
    message[type](content, duration)
  }

  messageList.push({
    type,
    content,
    duration,
    onClose,
    top,
    timeStamp
  })
}
