export default class User {
  id = 0
  name = ''
  username = ''
  password = ''
  confirm_password = ''
  role_id = null
  status = true
  expired_date = ''
}
export function userModel (data) {
  return Object.assign(new User(), {
    id: data.id, name: data.name, username: data.userName, role_id: data.roleId,
    status: data.status, expired_date: data.expiredDate === '9999-12-31' ? '' : (data.expiredDate || ''),
  })
}
