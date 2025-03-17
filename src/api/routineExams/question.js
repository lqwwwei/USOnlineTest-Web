import request from '@/utils/request'

// 查询【请填写功能名称】列表
export function listQuestion(query) {
    return request({
        url: '/system/question/list',
        method: 'get',
        params: query
    })
}

// 查询【请填写功能名称】详细
export function getQuestion(id) {
    return request({
        url: '/system/question/' + id,
        method: 'get'
    })
}

// 新增【请填写功能名称】
export function addQuestion(data) {
    return request({
        url: '/system/question',
        method: 'post',
        data: data
    })
}

// 修改【请填写功能名称】
export function updateQuestion(data) {
    return request({
        url: '/system/question',
        method: 'put',
        data: data
    })
}

// 删除【请填写功能名称】
export function delQuestion(id) {
    return request({
        url: '/system/question/' + id,
        method: 'delete'
    })
}
