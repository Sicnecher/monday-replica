import Cryptr from 'cryptr'
import bcrypt from 'bcrypt'

import { userService } from '../user/user.service.js'
import { loggerService as logger } from '../../services/logger.service.js'

const cryptr = new Cryptr(process.env.SECRET || 'Secret-Puk-1234')

export const authService = {
  signup,
  login,
  getLoginToken,
  validateToken,
}

async function login(email, password) {
  logger.debug(`auth.service - login with email: ${email}`)

  const user = await userService.getByEmail(email)
  if (!user) return Promise.reject('Invalid email or password')

  // TODO: un-comment for real login
  // const match = await bcrypt.compare(password, user.password)
  // if (!match) return Promise.reject('Invalid email or password')

  delete user.password
  user._id = user._id.toString()
  return user
}

async function signup({ email, password, fullName, color, imgUrl, isAdmin }) {
  const saltRounds = 10

  logger.debug(
    `auth.service - signup with email: ${email}, fullName: ${fullName}`
  )
  if (!email || !password || !fullName)
    return Promise.reject('Missing required signup information')

  const userExist = await userService.getByEmail(email)
  if (userExist) return Promise.reject('email already taken')

  const hash = await bcrypt.hash(password, saltRounds)
  return userService.add({
    email,
    password: hash,
    fullName,
    imgUrl,
    color,
    isAdmin,
  })
}

function getLoginToken(user) {
  const userInfo = {
    _id: user._id,
    fullName: user.fullName,
    isAdmin: user.isAdmin,
  }
  return cryptr.encrypt(JSON.stringify(userInfo))
}

function validateToken(loginToken) {
  try {
    const json = cryptr.decrypt(loginToken)
    const loggedinUser = JSON.parse(json)
    return loggedinUser
  } catch (err) {
    console.log('Invalid login token')
  }
  return null
}
