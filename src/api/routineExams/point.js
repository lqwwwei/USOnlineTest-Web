import request from '@/utils/request'

// 查询【请填写功能名称】列表
export function listPoint(query) {
    return request({
        url: '/system/point/list',
        method: 'get',
        params: query
    })
}

// 查询【请填写功能名称】详细
export function getPoint(id) {
    return request({
        url: '/system/point/' + id,
        method: 'get'
    })
}

// 新增【请填写功能名称】
export function addPoint(data) {
    return request({
        url: '/system/point',
        method: 'post',
        data: data
    })
}

// 修改【请填写功能名称】
export function updatePoint(data) {
    return request({
        url: '/system/point',
        method: 'put',
        data: data
    })
}

// 删除【请填写功能名称】
export function delPoint(id) {
    return request({
        url: '/system/point/' + id,
        method: 'delete'
    })
}
