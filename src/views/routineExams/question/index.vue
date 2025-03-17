<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" :inline="true" v-show="showSearch" >
      <el-form-item label="知识点" prop="knowledgeId">
        <el-input
            v-model="queryParams.knowledgeId"
            placeholder="请输入知识点"
            clearable
            @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="类型" prop="type">
        <el-input
            v-model="queryParams.type"
            placeholder="请输入类型"
            clearable
            @keyup.enter.native="handleQuery"
        />
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

    <el-table v-loading="loading" :data="questionList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="内容" align="center" prop="content"/>
      <el-table-column label="选项A" align="center" prop="optionA"/>
      <el-table-column label="选项B" align="center" prop="optionB"/>
      <el-table-column label="选项C" align="center" prop="optionC"/>
      <el-table-column label="选项D" align="center" prop="optionD"/>
      <el-table-column label="正确答案" align="center" prop="correctAnswer"/>
      <el-table-column label="类型" align="center" prop="type"/>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
              link
              type="primary"
              icon="el-icon-edit"
              @click="handleUpdate(scope.row)"
              v-hasPermi="['system:question:edit']"
          >修改
          </el-button>
          <el-button
              link
              type="primary"
              icon="el-icon-delete"
              @click="handleDelete(scope.row)"
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
        <el-form-item label="知识点" prop="knowledgeId">
          <el-input v-model="form.knowledgeId" placeholder="请输入知识点"/>
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
import {ref, reactive, onMounted,toRefs} from 'vue';
import {listQuestion, getQuestion, delQuestion, addQuestion, updateQuestion} from '@/api/routineExams/question';
import {ElMessage, ElMessageBox} from 'element-plus';
// 数据声明
const title = ref('');
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const questionList = ref([]);
const total = ref(0);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);

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
    content: [{required: true, message: "$comment不能为空", trigger: "blur"}],
    optionA: [{required: true, message: "选项A不能为空", trigger: "blur"}],
    optionB: [{required: true, message: "选项B不能为空", trigger: "blur"}],
    optionC: [{required: true, message: "选项C不能为空", trigger: "blur"}],
    optionD: [{required: true, message: "选项D不能为空", trigger: "blur"}],
    correctAnswer: [{required: true, message: "$comment不能为空", trigger: "blur"}],
    type: [{required: true, message: "0-单选 1-多选 2-判断不能为空", trigger: "change"}],
    score: [{required: true, message: "$comment不能为空", trigger: "blur"}],
    knowledgeId: [{required: true, message: "$comment不能为空", trigger: "blur"}]
  }
})

const {queryParams, form, rules} = toRefs(data)

// 生命周期钩子
function initialize() {
  getList();
}

onMounted(initialize);

// 方法定义
function getList() {
  loading.value = true;
  listQuestion(queryParams).then(function (response) {
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
 form.value={
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
  title.value = "添加【请填写功能名称】";
}

function handleUpdate(row) {
  reset();
  const id = row.id || ids.value;
  getQuestion(id).then(function (response) {
    Object.assign(form, response.data);
    open.value = true;
    title.value = "修改【请填写功能名称】";
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

function handleDelete(row) {
  const idsToDelete = row.id || ids.value;
  ElMessageBox.confirm('是否确认删除【请填写功能名称】编号为"' + idsToDelete + '"的数据项？').then(function () {
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

</script>