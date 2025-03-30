import request from '@/utils/request'

// 查询考试得分记录列表
export function listScore(query) {
  return request({
    url: '/system/score/list',
    method: 'get',
    params: query
  })
}

// 查询考试得分记录详细
export function getScore(id) {
  return request({
    url: '/system/score/' + id,
    method: 'get'
  })
}

// 新增考试得分记录
export function addScore(data) {
  return request({
    url: '/system/score',
    method: 'post',
    data: data
  })
}

// 修改考试得分记录
export function updateScore(data) {
  return request({
    url: '/system/score',
    method: 'put',
    data: data
  })
}

// 删除考试得分记录
export function delScore(id) {
  return request({
    url: '/system/score/' + id,
    method: 'delete'
  })
}
