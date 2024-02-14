'use strict'

const loggerInstance = require('../loaders/logger')

exports.writeLog = (message, type) => {
  if (type) {
    switch (type) {
      case 'info':
        loggerInstance.info(message)
      case 'error':
        loggerInstance.error(message)
      case 'warning':
        loggerInstance.warning(message)
    }
  } else {
    loggerInstance.info(message)
  }
}

exports.DbNull = (value, varType) => {
  if (value === null || value === undefined) {
    switch (varType) {
      case 'Number':
      case 'Dec':
        return 0.0
      case 'Integer16':
      case 'Integer':
      case 'Integer32':
      case 'Integer64':
        return 0
      case 'Text':
        return ''
      case 'Bool':
        return false
      case 'Date':
      case 'DateTime':
        return null
      default:
        return null
    }
  }

  switch (varType) {
    case 'Number':
    case 'Dec':
      return parseFloat(value)
    case 'Integer16':
    case 'Integer':
    case 'Integer32':
    case 'Integer64':
      return parseInt(value, 10)
    case 'Text':
      return String(value)
    case 'Bool':
      return Boolean(value)
    case 'Date':
      return new Date(value) // Assuming value is in a format that Date() can parse
    case 'DateTime':
      return new Date(value)
    default:
      return value
  }
}

exports.IsNull = (value, varType, isReplaceNewLineCharacter = true) => {
  if (value === null || value === undefined) {
    switch (varType) {
      case 'Number':
      case 'Dec':
      case 'Integer':
      case 'Integer16':
      case 'Integer32':
      case 'Integer64':
        return 0
      case 'Text':
        return ''
      case 'Bool':
        return false
      default:
        return null
    }
  }

  switch (varType) {
    case 'Number':
    case 'Dec':
    case 'Integer':
    case 'Integer16':
    case 'Integer32':
    case 'Integer64':
      return value
    case 'Text':
      if (isReplaceNewLineCharacter) {
        value = value.toString().replace(/\n/g, ' ')
        value = value.replace(/\r/g, ' ')
        value = value.replace(/\t/g, ' ')
      }
      value = value.replace(/\?/g, ' ')
      value = value.replace(/!/g, ' ')
      value = value.replace(/\^/g, ' ')
      value = value.replace(/</g, ' ')
      value = value.replace(/>/g, ' ')
      value = value.replace(/~/g, ' ')
      value = value.replace(/{/g, ' ')
      value = value.replace(/}/g, ' ')
      value = value.replace(/]/g, ' ')
      value = value.replace(/\[/g, ' ')
      value = value.replace(/[^\x1F-\x7F]/g, '')
      return value
    case 'Bool':
      return Boolean(value)
    default:
      return value
  }
}
