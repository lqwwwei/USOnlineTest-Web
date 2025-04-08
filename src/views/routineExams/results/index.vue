<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="考试名称" prop="examName">
        <el-input
            v-model="queryParams.examName"
            placeholder="请输入考试名称"
            clearable
            @keyup.enter="handleQuery"
        />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
            type="primary"
            plain
            icon="Plus"
            @click="handleAdd"
            v-hasPermi="['system:results:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
            type="success"
            plain
            icon="Edit"
            :disabled="single"
            @click="handleUpdate"
            v-hasPermi="['system:results:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
            type="danger"
            plain
            icon="Delete"
            :disabled="multiple"
            @click="handleDelete"
            v-hasPermi="['system:results:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
            type="warning"
            plain
            icon="Download"
            @click="handleExport"
            v-hasPermi="['system:results:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

      <el-table v-loading="loading" :data="examsList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center"/>
        <el-table-column label="考试名称" align="center" prop="examName"/>
        <el-table-column label="考试方式" align="center" prop="examType">
          <template #default="{ row }">
            <span>{{ formatExamType(row.examType) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="考试状态" align="center" prop="examStatus">
          <template #default="{ row }">
            <span>{{ formatExamStatus(row.examType) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="开始时间" align="center" prop="startTime" width="180">
        </el-table-column>
        <el-table-column label="结束时间" align="center" prop="endTime" width="180">
        </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button
              link
              type="primary"
              icon="Edit"
              @click="handleRecord(scope.row)"
              v-hasPermi="['system:results:edit']"
          >查看成绩</el-button>
          <el-button
              link
              type="primary"
              icon="View"
              @click="preview(scope.row)"
              v-hasPermi="['system:results:edit']"
          >详情</el-button>
        </template>

      </el-table-column>
    </el-table>

    <pagination
        v-show="total>0"
        :total="total"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        @pagination="getList"
    />

    <!-- 添加或修改对话框 -->
    <el-dialog :title="title" v-model="open" width="500px"  append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="用户id" prop="userId">
          <el-input v-model="form.userId" placeholder="请输入用户id" />
        </el-form-item>
        <el-form-item label="考试id" prop="examId">
          <el-input v-model="form.examId" placeholder="请输入考试id" />
        </el-form-item>
        <el-form-item label="试卷id" prop="paperId">
          <el-input v-model="form.paperId" placeholder="请输入试卷id" />
        </el-form-item>
        <el-form-item label="总分" prop="totalScore">
          <el-input v-model="form.totalScore" placeholder="请输入总分" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
        id="examAnalysisDialog"
    v-model="detailVisible"
    width="750px"
    append-to-body
    class="analysis-dialog"
    >
      <div class="el-dialog__body">
        <h2>试卷分析表</h2>
      <el-table
          :data="analysisTable"
          border
          :show-header="false"
          :span-method="spanMethod"
          class="analysis-table"
      >
        <el-table-column prop="label" width="150" />
        <el-table-column prop="col1" width="140" />
        <el-table-column prop="col2" width="140" />
        <el-table-column prop="col3" width="140" />
        <el-table-column prop="col4" width="140" />
      </el-table>
      <div class="chart-container">
        <h3>学生成绩分布图</h3>
        <div ref="scoreChart"  id="scoreChart"  style="width: 100%; height: 300px;"></div>
      </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="exportToPDF" type="primary" icon="Download">导出PDF</el-button>
          <el-button @click="detailVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import {ref, reactive, onMounted, watch, toRefs} from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { listResults, getResults, delResults, addResults, updateResults } from "@/api/routineExams/results";
import {listExams} from "@/api/routineExams/exams";
import {useRouter} from "vue-router";
import {getDetail} from "@/api/routineExams/results";
import * as echarts from 'echarts'
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const loading = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const showSearch = ref(true);
const total = ref(0);
const examsList = ref([]);
const title = ref("");  //标题
const open = ref(false);
const formRef = ref(null);
const router=useRouter()
const examDetail=ref('')
// 查询参数
const data = reactive({

  queryParams: {
    pageNum: 1,
    pageSize: 10,
    examName: null,
    startTime: null,
    endTime: null,
    paperId: null,
    examType: null,
    examStatus: null,
    candidateIds: null,
    attendeeIds: null
},

// 表单数据
 form: {
  id: null,
  userId: null,
  examId: null,
  paperId: null,
  totalScore: null,
  createTime: null
},

// 表单验证规则
 rules :{}
})
const {queryParams, form, rules} = toRefs(data)
const detailVisible = ref(false);

function formatExamType(examType) {
  return examType === 0 ? '闭卷' : '开卷';
}
function formatExamStatus(examStatus){
  return examStatus === 0 ? '进行中' : '已结束';
}

// 考试类型映射
const EXAM_TYPE_MAP = {
  '0': { text: '闭卷', value: '0' },
  '1': { text: '开卷', value: '1' }
}

// 格式化分数段数据
const formatScoreDistribution = (distribution, fullScore = 100) => {
  // 定义标准的5个分数段
  const standardRanges = [
    { range: '0-60%', scoreRange: '不及格' },
    { range: '60%-70%', scoreRange: '及格' },
    { range: '70%-80%', scoreRange: '中等' },
    { range: '80%-90%', scoreRange: '良好' },
    { range: '90%-100%', scoreRange: '优秀' }
  ]

  // 如果没有数据或数据为空，返回全0的5个分数段
  if (!distribution || distribution.length === 0) {
    return standardRanges.map(item => ({
      ...item,
      count: 0,
      percentage: '0%'
    }))
  }

  // 将后端返回的数据转换为标准格式
  const distributionMap = {}
  distribution.forEach(item => {
    const key = item.scoreRange || '全部'
    distributionMap[key] = item
  })

  // 合并标准分数段和实际数据
  return standardRanges.map(item => {
    const matchedItem = distributionMap[item.scoreRange] || {}
    return {
      range: item.range,
      scoreRange: item.scoreRange,
      count: matchedItem.count || 0,
      percentage: matchedItem.percentage || '0%'
    }
  })
}
// 计算表格数据
const analysisTable = computed(() => {
  const data =examDetail.value
  const scoreDist = formatScoreDistribution(data.scoreDistribution, data.fullScore || 100)
  const examType = EXAM_TYPE_MAP[data.examType] || {}

  return [
    { label: '课程名称', col1: data.examName || '-', col2: '', col3: '开课单位', col4: '超声学科' },
    { label: '出卷人', col1: data.createBy || '-', col2: '', col3: '', col4: '' },
    {
      label: '考试形式(打√)',
      col1: data.examType === '1' ? '✓ 开卷' : '开卷',
      col2: data.examType === '0' ? '✓ 闭卷' : '闭卷',
      col3: '',
      col4: ''
    },
    { label: '教学班组成', col1: '腹部超声室', col2: '', col3: '', col4: '' },
    { label: '出勤情况', col1: '应到', col2: '实到', col3: '其他', col4: '违纪' },
    {
      label: '',
      col1: data.totalCandidates?.toString() || '0',
      col2: data.actualCandidates?.toString() || '0',
      col3: '0',
      col4: '0'
    },
    {
      label: '分数段',
      col1: scoreDist[0]?.range || '-',
      col2: scoreDist[1]?.range || '-',
      col3: scoreDist[2]?.range || '-',
      col4: scoreDist[3]?.range || '-'
    },
    {
      label: '人数',
      col1: scoreDist[0]?.count?.toString() || '0',
      col2: scoreDist[1]?.count?.toString() || '0',
      col3: scoreDist[2]?.count?.toString() || '0',
      col4: scoreDist[3]?.count?.toString() || '0'
    },
    {
      label: '比例',
      col1: scoreDist[0]?.percentage || '0%',
      col2: scoreDist[1]?.percentage || '0%',
      col3: scoreDist[2]?.percentage || '0%',
      col4: scoreDist[3]?.percentage || '0%'
    },
    {
      label: '平均分',
      col1: data.averageScore?.toString() || '0',
      col2: '',
      col3: '标准差',
      col4: data.standardDeviation ? data.standardDeviation.toFixed(2) : '0.00'
    }
  ]
})

// 合并单元格方法
const spanMethod = ({ rowIndex, columnIndex }) => {
  // 合并出卷人行
  if (rowIndex === 1 && columnIndex === 1) {
    return { rowspan: 1, colspan: 4 }
  }
  // 合并教学班组成行
}

const scoreChart = ref(null)
let chartInstance = null

// 在examDetail变化时渲染图表
watch(detailVisible, (newVal) => {
  if (newVal && examDetail.value) {
    nextTick(() => {
      renderScoreChart(examDetail.value)
    })
  }
})

// 渲染成绩分布图
const renderScoreChart = (examData) => {
  if (!scoreChart.value) return

  // 销毁旧图表
  if (chartInstance) {
    chartInstance.dispose()
  }

  // 初始化图表
  chartInstance = echarts.init(scoreChart.value)

  // 准备数据
  const scoreDist = formatScoreDistribution(examData.scoreDistribution, examData.fullScore || 100)
  const ranges = scoreDist.map(item => item.range)
  const counts = scoreDist.map(item => item.count)

  // 配置项
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    xAxis: {
      type: 'category',
      data: ranges,
      axisLabel: {
        rotate: 30,
        interval: 0
      }
    },
    yAxis: {
      type: 'value',
      name: '人数'
    },
    series: [{
      name: '人数',
      type: 'bar',
      barWidth: '60%',
      data: counts.map((count, index) => ({
        value: count,
        itemStyle: {
          color: getColorByIndex(index)
        }
      })),
      label: {
        show: true,
        position: 'top'
      }
    }]
  }

  // 设置配置项
  chartInstance.setOption(option)

  // 响应式调整
  window.addEventListener('resize', function() {
    chartInstance && chartInstance.resize()
  })
}

// 根据索引获取不同颜色
const getColorByIndex = (index) => {
  const colors = [
    '#5470C6', // 蓝色
    '#91CC75', // 绿色
    '#FAC858', // 黄色
    '#EE6666', // 红色
    '#73C0DE'  // 浅蓝
  ]
  return colors[index % colors.length]
}




// 打开对话框方法

// 生命周期钩子
onMounted(() => {
  getList();
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
});

// 方法定义
function getList() {
  loading.value = true;
  listExams(queryParams.value).then(response => {
    examsList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  });
}

function handleRecord(row) {
  router.push({
    path: '/routineExams/examResults',
    query: {
      examId: row.examId
    }
  })
}

const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};

const resetQuery = () => {
  formRef.value?.resetFields();
  handleQuery();
};

const handleSelectionChange = (selection) => {
  ids.value = selection.map(item => item.id);
  single.value = selection.length !== 1;
  multiple.value = !selection.length;
};

const handleAdd = () => {
  reset();
  open.value = true;
  title.value = "添加考试成绩";
};

const handleUpdate = async (row) => {
  reset();
  const id = row.id || ids.value[0];
  try {
    const response = await getResults(id);
    Object.assign(form, response.data);
    open.value = true;
    title.value = "修改考试成绩";
  } catch (error) {
    console.error(error);
  }
};

const submitForm = async () => {
  await formRef.value.validate();

  try {
    if (form.id != null) {
      await updateResults(form);
      ElMessage.success("修改成功");
    } else {
      await addResults(form);
      ElMessage.success("新增成功");
    }
    open.value = false;
    getList();
  } catch (error) {
    console.error(error);
  }
};

const handleDelete = async (row) => {
  const deleteIds = row.id || ids.value;
  try {
    await ElMessageBox.confirm(`是否确认删除考试成绩编号为"${deleteIds}"的数据项？`, "警告", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });
    await delResults(deleteIds);
    ElMessage.success("删除成功");
    getList();
  } catch (error) {
    console.error(error);
  }
};

const handleExport = () => {
  // 导出逻辑保持不变
  download('system/results/export', {
    ...queryParams
  }, `results_${new Date().getTime()}.xlsx`);
};

const reset = () => {
  Object.assign(form, {
    id: null,
    userId: null,
    examId: null,
    paperId: null,
    totalScore: null,
    createTime: null
  });
  if (formRef.value) {
    formRef.value.resetFields();
  }
};

const cancel = () => {
  open.value = false;
  reset();
};
async function preview(row){
  try {
    loading.value = true;
    const response = await getDetail(row.examId);
    examDetail.value = response.data;
    await nextTick();
    if (examDetail.value.scoreDistribution && examDetail.value.scoreDistribution.length === 1 &&
        !examDetail.value.scoreDistribution[0].range) {
      // If there's only one range and it's null, set it to "全部"
      examDetail.value.scoreDistribution[0].range = '全部';
    }

    detailVisible.value = true;
  } catch (error) {
    console.error(error);
    ElMessage.error('获取考试详情失败');
  } finally {
    loading.value = false;
  }
}

const exportToPDF = async () => {
  try {
    if (!detailVisible.value) {
      ElMessage.error('请先打开分析报表');
      return;
    }

    loading.value = true;

    // 1. 获取图表图像
    const chartDataURL = chartInstance.getDataURL({
      pixelRatio: 2,
      backgroundColor: '#fff'
    });

    // 2. 克隆内容区域
    const originalDialog = document.getElementById('examAnalysisDialog');
    const contentWrapper = originalDialog.querySelector('.el-dialog__body');
    const deepClone = contentWrapper.cloneNode(true);

    // 3. 替换图表为静态图片
    const chartDiv = deepClone.querySelector('#scoreChart');
    if (chartDiv) {
      const img = document.createElement('img');
      img.id = 'chart-export-image';
      img.src = chartDataURL;
      img.style.width = '100%';
      img.style.height = '300px';
      chartDiv.parentNode.replaceChild(img, chartDiv);
    }

    // 4. 创建克隆容器
    const cloneContainer = document.createElement('div');
    cloneContainer.className = 'clone-export-container';
    cloneContainer.style.cssText = `
      position: fixed;
      left: -9999px;
      top: 0;
      width: ${originalDialog.offsetWidth}px;
      background: #fff;
      padding: 20px;
      box-sizing: border-box;
    `;
    cloneContainer.appendChild(deepClone);
    document.body.appendChild(cloneContainer);

    // 5. 确保图片加载
    const img = cloneContainer.querySelector('#chart-export-image');
    if (!img) throw new Error('找不到图表图片');

    await new Promise((resolve, reject) => {
      if (img.complete) {
        resolve();
      } else {
        img.onload = resolve;
        img.onerror = () => reject(new Error('图片加载失败'));
        setTimeout(() => reject(new Error('图片加载超时')), 5000);
      }
    });

    // 6. 生成PDF
    const canvas = await html2canvas(cloneContainer, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#fff',
      logging: true
    });

    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 190;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, 10, imgWidth, imgHeight);
    pdf.save(`试卷分析_${examDetail.value.examName || '未命名'}.pdf`);

    // 7. 清理DOM
    document.body.removeChild(cloneContainer);
    ElMessage.success('导出成功');
  } catch (error) {
    ElMessage.error(`导出失败: ${error.message}`);
    console.error('导出错误:', error);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
#examAnalysisDialog {
  margin: 0 !important;
  max-width: 100% !important;
}

/* 调整对话框内边距 */
.analysis-dialog .el-dialog__body {
  padding: 20px;
  background: #fff;
}
.el-dialog__body h2{
  margin-bottom: 15px;
  color: #333;
  text-align: center;
}

/* 修复表格显示问题 */
.analysis-table .el-table__body {
  width: 100% !important;
}
.chart-container {
  margin-top: 30px;
  padding: 20px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.chart-container h3 {
  margin-bottom: 15px;
  color: #333;
  text-align: center;
}

.analysis-table {
  margin-bottom: 20px;
}
</style>