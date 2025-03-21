import request from '@/utils/request'

// 查询【请填写功能名称】列表
export function listPaper(query) {
    return request({
        url: '/system/paper/list',
        method: 'get',
        params: query
    })
}

// 查询【请填写功能名称】详细
export function getPaper(id) {
    return request({
        url: '/system/paper/' + id,
        method: 'get'
    })
}

// 新增【请填写功能名称】
export function addPaper(data) {
    return request({
        url: '/system/paper',
        method: 'post',
        data: data
    })
}

// 修改【请填写功能名称】
export function updatePaper(data) {
    return request({
        url: '/system/paper',
        method: 'put',
        data: data
    })
}

// 删除【请填写功能名称】
export function delPaper(id) {
    return request({
        url: '/system/paper/' + id,
        method: 'delete'
    })
}
