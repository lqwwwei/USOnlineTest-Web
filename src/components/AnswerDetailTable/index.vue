<template>
  <el-table :data="answerData" border :span-method="mergeHandler" class="answer-sheet">
    <!-- 固定列 -->
    <el-table-column prop="type" label="类型" width="120" align="left" />

    <!-- 动态生成题号列 -->
    <el-table-column
        v-for="index in 10"
        :key="index"
        :label="String(index)"
        :prop="'q' + index"
        width="80"
        align="center"
    >
      <template #default="{ row, $index }">
        <span
            v-if="row.type === '用户答案'"
            :class="{
            'wrong-answer': isAnswerWrong(row, $index, index)
          }"
        >
          {{ row['q' + index] || '-' }}
        </span>
        <span v-else>
          {{ row['q' + index] || '-' }}
        </span>
      </template>
    </el-table-column>

    <!-- 得分列 -->
    <el-table-column prop="score" label="得分" width="100" align="left">
      <template #default="{ row }">
        <span v-if="row.type === '用户答案' || row.isTotal" class="score-cell">
          {{ row.score ?? 0 }}
        </span>
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  rawData: {
    type: Array,
    required: true
  }
})

const answerData = computed(() => processData(props.rawData))

const processData = (rawData) => {
  if (!rawData || rawData.length === 0) return []

  const result = []
  let totalScore = 0

  // 按题型分割数据（假设每个题型10题）
  const sections = [
    { title: '一、单选题', data: rawData.slice(0, 10) },
    { title: '二、多选题', data: rawData.slice(10, 20) },
    { title: '三、判断题', data: rawData.slice(20, 30) }
  ]

  sections.forEach((section, sectionIndex) => {
    const sectionData = section.data || []
    const sectionScore = sectionData.reduce((sum, item) => sum + (item.score || 0), 0)
    totalScore += sectionScore
    // 题型标题行
    result.push({
      type: section.title,
      isTitle: true,
      score: sectionScore,
      ...generateEmptyColumns()
    })

    // 题号行
    result.push({
      type: '题号',
      ...generateQuestionNumbers()
    })

    // 正确答案行
    result.push({
      type: '正确答案',
      ...mapAnswers(sectionData, 'answer') // 使用correctAnswer类型映射答案
    })

    // 用户答案行
    result.push({
      type: '用户答案',
      score: sectionScore,
      ...mapAnswers(sectionData, 'userAnswer')
    })
  })

  // 总分行
  result.push({
    type: '总分',
    isTotal: true,
    ...generateEmptyColumns(), // 添加题目列
    score: totalScore // 确保score在最后
  })
  console.log(totalScore)
  return result
}
const generateQuestionNumbers = () => {
  return Array.from({ length: 10 }, (_, i) => ({
    [`q${i + 1}`]: i + 1
  })).reduce((acc, cur) => ({ ...acc, ...cur }), {})
}

const isAnswerWrong = (row, rowIndex, questionIndex) => {
  const correctRow = answerData.value[rowIndex - 1]
  if (!correctRow) return false

  let userAnswer = row[`q${questionIndex}`] || ''
  let answer = correctRow[`q${questionIndex}`] || ''

  userAnswer = userAnswer.split('').sort().join('')
  answer = answer.split('').sort().join('')

  return userAnswer !== answer
}

const mapAnswers = (data, field) => {
  return data.reduce((acc, item, index) => {
    let answer = item[field] || '-'
    if (index >= 10 && index < 20) {
      answer = answer.split('').sort().join('')
    }
    return {
      ...acc,
      [`q${index + 1}`]: answer
    }
  }, {})
}

const generateEmptyColumns = () => {
  return Array.from({ length: 10 }, (_, i) => ({
    [`q${i + 1}`]: null
  })).reduce((acc, cur) => ({ ...acc, ...cur }), {})
}

const mergeHandler = ({ row, columnIndex }) => {
  const totalCols = 12 // 类型列 + 10题 + 得分列

  if (row.isTitle) {
    // 题型标题行合并前12列
    if (columnIndex === 0) return { rowspan: 1, colspan: 12 }
    return { rowspan: 0, colspan: 0 }
  }
  else if (row.isTotal) {
    // 总分行只合并前11列，得分列单独显示
    if (columnIndex === 0) return { rowspan: 1, colspan: 11 }
    if (columnIndex === 11) return { rowspan: 1, colspan: 1 }
    return { rowspan: 0, colspan: 0 }
  }
  return { rowspan: 1, colspan: 1 }
}
</script>

<style lang="scss" scoped>
.answer-sheet {
  .title-row {
    font-weight: bold;
    background-color: #f5f7fa;

    td {
      font-size: 16px;
      color: #303133;
    }
  }

  .el-table__row {
    td:first-child {
      font-weight: 500;
    }
  }
}

.answer-sheet {
  .wrong-answer {
    color: #f56c6c; /* 错误答案：红色 */
    font-weight: bold;
  }

  .score-cell {
    font-weight: bold;
    color: #409eff; /* 得分列：蓝色 */
  }
}
</style>
