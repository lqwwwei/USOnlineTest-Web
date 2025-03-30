import request from '@/utils/request'

// 查询【请填写功能名称】列表
export function listExams(query) {
  return request({
    url: '/system/exams/list',
    method: 'get',
    params: query
  })
}

// 查询【请填写功能名称】详细
export function getExams(examId) {
  return request({
    url: '/system/exams/' + examId,
    method: 'get'
  })
}

// 新增【请填写功能名称】
export function addExams(data) {
  return request({
    url: '/system/exams',
    method: 'post',
    data: data
  })
}

// 修改【请填写功能名称】
export function updateExams(data) {
  return request({
    url: '/system/exams',
    method: 'put',
    data: data
  })
}

// 删除【请填写功能名称】
export function delExams(examId) {
  return request({
    url: '/system/exams/' + examId,
    method: 'delete'
  })
}

export function userWithRole(query) {
  return request({
    url: '/system/exams/UserlistWithRoles',
    method: 'get',
    params: query
  })
}
