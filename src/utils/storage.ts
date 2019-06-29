const storage = window.sessionStorage

export default class {
  // 若不存在对应的key，返回null
  static getItem(key: string) {
    const storageValue = storage.getItem(key)
    // 未设置该key
    if (storageValue === null) {
      return null
    } else {
      // 返回string类型的序列化后的value
      return JSON.parse(storageValue)
    }
  }

  static setItem(key: string, value: any) {
    if (key && value !== undefined) {
      const storageValue = JSON.stringify(value)
      storage.setItem(key, storageValue)
    }
  }

  static removeItem(key: string) {
    storage.removeItem(key)
  }

  static clear() {
    storage.clear()
  }
}
