<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" :inline="true" v-show="showSearch">
      <el-form-item label="知识点" prop="knowledgeId">
        <el-select v-model="queryParams.knowledgeId" clearable placeholder="请选择知识点">
          <el-option
              v-for="item in pointList"
              :key="item.id"
              :label="item.name"
              :value="item.id">
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="类型" prop="type">
        <el-select v-model="queryParams.type" clearable placeholder="请选择类型">
          <el-option
              v-for="item in typeList"
              :key="item.id"
              :label="item.type"
              :value="item.value">
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="创建时间" prop="createdAt">
        <el-date-picker clearable
                        v-model="queryParams.createdAt"
                        type="date"
                        value-format="yyyy-MM-dd"
                        placeholder="请选择时间">
        </el-date-picker>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="search" @click="handleQuery">搜索</el-button>
        <el-button icon="refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
            type="primary"
            plain
            icon="plus"
            @click="handleAdd"
            v-hasPermi="['system:question:add']"
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
            v-hasPermi="['system:question:edit']"
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
            v-hasPermi="['system:question:remove']"
        >删除
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
            type="info"
            plain
            icon="folder-add"
            @click="handleImport"
        >导入
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
            type="warning"
            plain
            icon="download"
            @click="handleExport"
            v-hasPermi="['system:question:export']"
        >导出
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="questionList" :row-style="{height:'10px'}"
              @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" show-overflow-tooltip/>
      <el-table-column label="类型" align="center" width="100">
        <template #default="{ row }">
          <span>{{ formattedType(row.type) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="内容" align="center" prop="content" width="400" show-overflow-tooltip/>
      <el-table-column label="选项A" align="center" prop="optionA" width="180" show-overflow-tooltip/>
      <el-table-column label="选项B" align="center" prop="optionB" width="180" show-overflow-tooltip/>
      <el-table-column label="选项C" align="center" prop="optionC" width="180" show-overflow-tooltip/>
      <el-table-column label="选项D" align="center" prop="optionD" width="180" show-overflow-tooltip/>
      <el-table-column label="正确答案" align="center" prop="correctAnswer"/>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="{ row }">
          <el-button
              link
              type="primary"
              icon="el-icon-edit"
              @click="handleUpdate(row)"
              v-hasPermi="['system:question:edit']"
          >修改
          </el-button>
          <el-button
              link
              type="primary"
              icon="el-icon-delete"
              @click="handleDelete(row)"
              v-hasPermi="['system:question:remove']"
          >删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
        v-show="total>0"
        :total="total"
        :page.sync="queryParams.pageNum"
        :limit.sync="queryParams.pageSize"
        @pagination="getList"
    />

    <!-- 添加或修改【请填写功能名称】对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="questionform" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="知识点" prop="knowledgeId">
          <el-select v-model="form.knowledgeId" placeholder="请选择知识点">
            <el-option
                v-for="item in pointList"
                :key="item.id"
                :label="item.name"
                :value="item.id">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.type" clearable placeholder="请选择类型">
            <el-option
                v-for="item in typeList"
                :key="item.id"
                :label="item.type"
                :value="item.value">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="内容">
          <el-input v-model="form.content" placeholder="内容"/>
        </el-form-item>
        <el-form-item label="选项A" prop="optionA">
          <el-input v-model="form.optionA" placeholder="请输入选项A"/>
        </el-form-item>
        <el-form-item label="选项B" prop="optionB">
          <el-input v-model="form.optionB" placeholder="请输入选项B"/>
        </el-form-item>
        <el-form-item label="选项C" prop="optionC">
          <el-input v-model="form.optionC" placeholder="请输入选项C"/>
        </el-form-item>
        <el-form-item label="选项D" prop="optionD">
          <el-input v-model="form.optionD" placeholder="请输入选项D"/>
        </el-form-item>
        <el-form-item label="正确答案" prop="correctAnswer">
          <el-input v-model="form.correctAnswer" placeholder="请输入正确答案"/>
        </el-form-item>

      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>


    <el-dialog title="试题导入" v-model="show" width="500px" append-to-body>
      <el-form ref="" label-width="80px">
        <el-form-item label="知识点" prop="">
          <el-select v-model="importKnowledgeId" placeholder="请选择知识点">
            <el-option
                v-for="item in pointList"
                :key="item.id"
                :label="item.name"
                :value="item.id">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="题型" prop="">
          <el-select v-model="importType" placeholder="请选择类型">
            <el-option
                v-for="item in typeList"
                :key="item.id"
                :label="item.type"
                :value="item.value">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="文件导入" prop="">
          <el-upload
              ref="uploadRef"
              :limit="1"
              accept=".xlsx, .xls"
              :headers="headers"
              :data="{ knowledgeId: importKnowledgeId, type: importType }"
              :action="upload.url"
              :disabled="upload.isUploading"
              :on-progress="handleFileUploadProgress"
              :on-success="handleFileSuccess"
              :auto-upload="false"
              drag
          >
            <el-icon class="el-icon--upload">
              <upload-filled/>
            </el-icon>
            <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
            <template #tip>
              <div class="el-upload__tip text-center">
                <span>仅允许导入 xls、xlsx 格式文件。</span>
                <el-link
                    type="primary"
                    :underline="false"
                    style="font-size:12px;vertical-align: baseline;"
                    @click="importTemplate"
                >
                  下载模板
                </el-link>
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitFileForm">确 定</el-button>
          <el-button @click="show = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>


  </div>
</template>
<script setup>
import {ref, reactive, onMounted, toRefs, computed, getCurrentInstance} from 'vue';
import {
  listQuestion,
  getQuestion,
  delQuestion,
  addQuestion,
  updateQuestion,
  listQuestiontype
} from '@/api/routineExams/question';
import {listPoint} from '@/api/routineExams/point';
import {ElMessage, ElMessageBox} from 'element-plus';
import {getToken} from "@/utils/auth";
// 数据声明
const {proxy} = getCurrentInstance();
const title = ref('');
const open = ref(false);
const show = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const questionList = ref([]);
const total = ref(0);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const pointList = ref([]);
const typeList = ref([]);
const fileList = ref([])
const headers = ref({Authorization: 'Bearer ' + getToken()})
const importKnowledgeId = ref('')
const importType = ref('')
const data = reactive({
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    content: null,
    optionA: null,
    optionB: null,
    optionC: null,
    optionD: null,
    correctAnswer: null,
    type: null,
    score: null,
    knowledgeId: null,
    createdAt: null
  },
  form: {},
  rules: {
    content: [{required: true, message: "内容不能为空", trigger: "blur"}],
    optionA: [{required: true, message: "选项A不能为空", trigger: "blur"}],
    optionB: [{required: true, message: "选项B不能为空", trigger: "blur"}],
    optionC: [{required: true, message: "选项C不能为空", trigger: "blur"}],
    optionD: [{required: true, message: "选项D不能为空", trigger: "blur"}],
    correctAnswer: [{required: true, message: "正确答案不能为空", trigger: "blur"}],
    type: [{required: true, message: "0-单选 1-多选 2-判断不能为空", trigger: "change"}],
    // score: [{required: true, message: "得分不能为空", trigger: "blur"}],
    knowledgeId: [{required: true, message: "知识点不能为空", trigger: "blur"}]
  },
})

const {queryParams, form, rules} = toRefs(data)

const formattedType = computed(() => (type) => {
  return {
    0: '单选题',
    1: '判断题',
    2: '多选题'
  }[type] || '';
});
const upload = ref({
  url: import.meta.env.VITE_APP_BASE_API + "/system/question/import",
  isUploading: false, // 是否正在上传
});

// 生命周期钩子
function initialize() {
  Configuration()
  getList();
}

onMounted(initialize);

// 方法定义
async function Configuration() {
  loading.value = true;
  try {
    const res = await listPoint(queryParams.value);
    const respose = await listQuestiontype();
    pointList.value = res.rows;
    typeList.value = respose.rows;
  } catch (error) {
    ElMessage.error('获取数据失败');
  } finally {
    loading.value = false;
  }
}

function getList() {
  loading.value = true;
  listQuestion(queryParams.value).then(function (response) {
    questionList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  });
}

function cancel() {
  open.value = false;
  reset();
}

function reset() {
  form.value = {
    id: null,
    content: null,
    optionA: null,
    optionB: null,
    optionC: null,
    optionD: null,
    correctAnswer: null,
    type: null,
    score: null,
    knowledgeId: null,
    createdAt: null
  };
  // 注意：resetForm方法需要根据实际实现来调用
}

function handleQuery() {
  queryParams.pageNum = 1;
  getList();
}

function resetQuery() {
  // 注意：resetForm方法需要根据实际实现来调用
  handleQuery();
}

function handleSelectionChange(selection) {
  ids.value = selection.map(function (item) {
    return item.id;
  });
  single.value = selection.length !== 1;
  multiple.value = !selection.length;
}

function handleAdd() {
  reset();
  open.value = true;
  title.value = "新增试题";
}

function handleUpdate(row) {
  reset();
  const id = row.id || ids.value;
  getQuestion(id).then(function (response) {
    Object.assign(form.value, response.data);
    open.value = true;
    title.value = "修改试题";
  });
}

function submitForm() {
  // 注意：这里需要根据实际表单验证逻辑进行调整
  if (form.value.id != null) {
    updateQuestion(form.value).then(function (response) {
      ElMessage.success("修改成功");
      open.value = false;
      getList();
    });
  } else {
    addQuestion(form.value).then(function (response) {
      ElMessage.success("新增成功");
      open.value = false;
      getList();
    });
  }
}

function handleImport() {
  show.value = true;
}

function handleDelete(row) {
  const idsToDelete = row.id || ids.value;
  ElMessageBox.confirm('是否确认删除').then(function () {
    return delQuestion(idsToDelete);
  }).then(function () {
    getList();
    ElMessage.success("删除成功");
  }).catch(function () {
  });
}

function handleExport() {
  download('system/question/export', {...queryParams}, `question_${new Date().getTime()}.xlsx`);
}

// function beforeUpload(rawFile) {
//   console.log(importKnowledgeId.value)
//   if (!importKnowledgeId) {
//     ElMessage.error('请先选择知识点');
//     return false;
//   }
//
//   // 检查文件扩展名
//   const isXlsx = rawFile.name.endsWith('.xlsx')
//   // 检查 MIME 类型
//   const correctMimeType =
//       rawFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
//   if (!isXlsx || !correctMimeType) {
//     ElMessage.error('试卷必须是 xlsx 格式！')
//     return false
//   }
//   return true
// }

function handleFileSuccess(response) {
  if (response.code === 500) {
    fileList.value = []
    ElMessage.error(response.msg)
  } else if (response.code === 200) {

    fileList.value.push({name: response.name, url: response.name})
    // 重置知识点选择
    data.importKnowledgeId = null;
    getList()
    ElMessage.success('导入成功');
  }
}


function importTemplate() {
  proxy.download("system/question/importTemplate", {}, `question_template_${new Date().getTime()}.xlsx`);
};
const handleFileUploadProgress = (event, file, fileList) => {
  upload.isUploading = true;
};
 function submitFileForm() {
  show.value=false;
  proxy.$refs["uploadRef"].submit();

}
</script>