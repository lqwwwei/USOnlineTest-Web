import request from '@/utils/request'

// 查询【请填写功能名称】列表
export function listResults(query) {
  return request({
    url: '/system/results/list',
    method: 'get',
    params: query
  })
}

// 查询【请填写功能名称】详细
export function getResults(id) {
  return request({
    url: '/system/results/' + id,
    method: 'get'
  })
}

// 新增【请填写功能名称】
export function addResults(data) {
  return request({
    url: '/system/results',
    method: 'post',
    data: data
  })
}

// 修改【请填写功能名称】
export function updateResults(data) {
  return request({
    url: '/system/results',
    method: 'put',
    data: data
  })
}

// 删除【请填写功能名称】
export function delResults(id) {
  return request({
    url: '/system/results/' + id,
    method: 'delete'
  })
}

export function getDetail(id) {
  return request({
    url: '/system/examStatistics/' + id,
    method: 'get'
  })
}

