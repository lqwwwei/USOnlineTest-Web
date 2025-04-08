<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="试卷名称" prop="title">
        <el-input
            v-model="queryParams.title"
            placeholder="请输入试卷名称"
            clearable
            @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="出卷人" prop="createdBy">
        <el-input
            v-model="queryParams.createdBy"
            placeholder="请输入出卷人"
            clearable
            @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="创建时间" prop="createdAt">
        <el-date-picker clearable
                        v-model="queryParams.createdAt"
                        type="date"
                        value-format="yyyy-MM-dd"
                        placeholder="请选择创建时间">
        </el-date-picker>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
            type="primary"
            plain
            icon="plus"
            @click="handleAdd"
            v-hasPermi="['system:paper:add']"
        >新增
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
            type="success"
            plain
            icon="edit"
            :disabled="single"
            @click="handleUpdate"
            v-hasPermi="['system:paper:edit']"
        >修改
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
            type="danger"
            plain
            icon="delete"
            :disabled="multiple"
            @click="handleDelete"
            v-hasPermi="['system:paper:remove']"
        >删除
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
            type="warning"
            plain
            icon="download"
            @click="handleExport"
            v-hasPermi="['system:paper:export']"
        >导出
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="paperList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="试卷名称" align="center" prop="title"/>
      <el-table-column label="试卷总分" align="center" prop="totalScore"/>
      <el-table-column label="及格分数" align="center" prop="passScore"/>
      <el-table-column label="出卷人" align="center" prop="createdBy"/>
      <el-table-column label="创建时间" align="center" prop="createdAt" width="180">
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="{ row }">
          <el-button
              link
              type="primary"
              icon="search"
              @click="preview(row)"
              v-hasPermi="['system:paper:check']"
          >预览
          </el-button>
          <el-button
              link
              type="primary"
              icon="edit"
              @click="handleUpdate(row)"
              v-hasPermi="['system:paper:edit']"
          >修改
          </el-button>
          <el-button
              link
              type="primary"
              icon="delete"
              @click="handleDelete(row)"
              v-hasPermi="['system:paper:remove']"
          >删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
        v-show="total > 0"
        :total="total"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        @pagination="getList"
    />

    <!-- 添加或修改【请填写功能名称】对话框 -->
    <el-dialog :title="title" v-model="open" width="1000px" append-to-body>
      <el-form :model="form" label-width="80px">
        <el-form-item label="试卷名称" prop="title">
          <el-input v-model="form.title" placeholder="请输入试卷名称"/>
        </el-form-item>
        <el-form-item label="出卷人" prop="createdBy">
          <el-input v-model="form.createdBy" placeholder="请输入出卷人"/>
        </el-form-item>

        <!-- 动态规则 -->
        <div v-for="(rule, index) in form.rules" :key="index" class="rule-item">
          <el-form-item label="题型" :prop="`rules.${index}.questionType`">
            <el-select v-model="rule.questionType" placeholder="选择题型" class="custom-width">
              <el-option
                  v-for="type in typeList"
                  :key="type.id"
                  :label="type.type"
                  :value="type.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="分值" :prop="`rules.${index}.questionScore`">
            <el-input-number v-model="rule.questionScore" :min="1" :max="5" class="custom-width"/>
          </el-form-item>

          <el-form-item label="数量" :prop="`rules.${index}.questionCount`">
            <el-input-number v-model="rule.questionCount" :min="1" :max="10" class="custom-width"/>
          </el-form-item>

          <el-form-item label="知识点" :prop="`rules.${index}.knowledgeId`">
            <el-select
                class="custom-height-select"
                v-model="rule.knowledgeId"
                placeholder="选择知识点"
                multiple
                :filterable="true"
                :reserve-keyword="false"
                collapse-tags
            >
              <el-option
                  v-for="point in pointList"
                  :key="point.id"
                  :label="point.name"
                  :value="point.id"
              />
            </el-select>
          </el-form-item>

          <el-button
              v-if="index >= 0"
              type="danger"
              icon="Delete"
              @click="removeRule(index)"
          />
        </div>

        <el-form-item>
          <el-button type="primary" @click="addRule">+ 添加规则</el-button>
        </el-form-item>
        <el-form-item label="总分">
          <span>{{ totalScore }}</span>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import {listPaper, getPaper, delPaper, addPaper, updatePaper} from "@/api/routineExams/paper";
import {onMounted, reactive, ref, toRefs, watch} from "vue";
import {ElMessage, ElMessageBox} from "element-plus";
import {listQuestiontype} from "@/api/routineExams/question";
import {listPoint} from "@/api/routineExams/point";
import {useRouter} from "vue-router";
const loading = ref(true);
const showSearch = ref(true);
const total = ref(0);
const paperList = ref([]);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const open = ref(false);
const title = ref('');
const typeList = ref([]);
const pointList = ref([]);
const router = useRouter()
const data = reactive({
  form: {
    id: null,
    title: null,
    totalScore: null,
    passScore: null,
    createdBy: null,
    createdAt: null,
    rules: [] // 定义 rules
  },
  totalScore: 0, // 新增：用于存储实时计算的总分
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    title: null,
    totalScore: null,
    passScore: null,
    createdBy: null,
    createdAt: null
  }
});

const {queryParams, form, totalScore} = toRefs(data);

watch(() => [...form.value.rules], (newRules) => { // 强制触发数组变化检测
  calculateTotalScore(newRules);
}, { deep: true });

function calculateTotalScore(rules) {
  if (rules && rules.length > 0) { // 判断数组不为空
    totalScore.value = rules.reduce((total, rule) => {
      return total + ((rule.questionScore || 0) * (rule.questionCount || 0));
    }, 0);
  }
}


function getList() {
  loading.value = true;
  listPaper(queryParams.value).then(response => {
    paperList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  });
}

function reset() {
  form.value = {
    id: null,
    title: null,
    totalScore: null,
    passScore: null,
    createdBy: null,
    createdAt: null,
    rules: [] // 初始化 rules 为空数组
  };
  totalScore.value = 0;
}

function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

function resetQuery() {
  handleQuery();
}

function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.id);
  single.value = selection.length !== 1;
  multiple.value = !selection.length;
}

function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加试卷";
}

function handleUpdate(row) {
  reset();
  const id = row.id || ids.value;
  getPaper(id).then(response => {
    // 处理从服务端返回的规则数据
    const processedData = {
      ...response.data,
      rules: response.data.rules ? JSON.parse(response.data.rules) : []
    };

    // 处理知识点的多选状态
    processedData.rules.forEach(rule => {
      if (typeof rule.knowledgeId === 'string') {
        rule.knowledgeId = rule.knowledgeId.split(',').map(Number);
      }
    });

    Object.assign(form.value, processedData);
    open.value = true;
    title.value = "修改试卷";
  });
}

function submitForm() {
  // 深拷贝 rules 数组避免污染原始数据
  const rulesToSubmit = JSON.parse(JSON.stringify(form.value.rules));

  // 处理 knowledgeId 多选数据
  rulesToSubmit.forEach(rule => {
    if (Array.isArray(rule.knowledgeId)) {
      rule.knowledgeId = rule.knowledgeId.join(',');
    }
  });

  // 准备提交数据
  const submitData = {
    ...form.value,
    rules: JSON.stringify(rulesToSubmit), // 转换为字符串
    totalScore: totalScore.value
  };

  // 提交请求
  const submitPromise = submitData.id
      ? updatePaper(submitData)
      : addPaper(submitData);

  submitPromise.then(() => {
    ElMessage.success(submitData.id ? "修改成功" : "新增成功");
    open.value = false;
    getList();
  });
}

function handleDelete(row) {
  const idsToDelete = row.id || ids.value;
  ElMessageBox.confirm(`是否确认删除？`)
      .then(() => delPaper(idsToDelete))
      .then(() => {
        getList();
        ElMessage.success("删除成功");
      })
      .catch(() => {
      });
}
function preview(row) {
  if (!row.id) {
    ElMessage.warning('试卷ID无效');
    return;
  }

  try {
    console.log(row.id)
    // 跳转到目标页面，并传递试卷 ID
    router.push({
      name: 'ExamPage',
      query: {
        paperId: row.id // 传递试卷 ID
      }
    });
  } catch (error) {
    console.error('跳转失败:', error);
  }
}

function handleExport() {
  console.log(444);
}

function cancel() {
  open.value = false;
  reset();
}

const addRule = () => {
  form.value.rules.push({
    questionType: null,
    questionScore: 0,
    questionCount: 1,
    knowledgeId: null
  });
};

const removeRule = (index) => {
  if (form.value.rules.length > 1) {
    form.value.rules.splice(index, 1); // 使用 form.value.rules
  } else {
    ElMessage.warning('至少需要保留一条规则');
  }
};

async function Configuration() {
  try {
    const res = await listPoint();
    const respose = await listQuestiontype();
    pointList.value = res.rows;
    typeList.value = respose.rows;
  } catch (error) {
    console.error('加载数据失败:', error);
  }
}

function initialize() {
  Configuration();
  getList();
}

onMounted(() => {
  initialize();
});
</script>
<style scoped>
.rule-container {
  margin: 20px 0;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 15px;
}

.rule-item {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.rule-item :deep(.el-form-item) {
  margin-bottom: 0;
  margin-right: 10px;
}

.rule-item:last-child {
  margin-bottom: 0;
}
.custom-width {
  width: 120px; /* 根据需要调整宽度 */
}
</style>