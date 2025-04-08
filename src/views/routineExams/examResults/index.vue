<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="用户姓名" prop="userName">
        <el-input
            v-model="queryParams.userName"
            placeholder="请输入用户姓名"
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
<!--        <el-button-->
<!--            type="primary"-->
<!--            plain-->
<!--            icon="Plus"-->
<!--            @click="handleAdd"-->
<!--            v-hasPermi="['system:results:add']"-->
<!--        >新增</el-button>-->
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
<!--        <el-button-->
<!--            type="danger"-->
<!--            plain-->
<!--            icon="Delete"-->
<!--            :disabled="multiple"-->
<!--            @click="handleDelete"-->
<!--            v-hasPermi="['system:results:remove']"-->
<!--        >删除</el-button>-->
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

    <el-table v-loading="loading" :data="resultsList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="id" align="center" prop="id" />
      <el-table-column label="考生" align="center" prop="userName" />
      <el-table-column label="总分" align="center" prop="totalScore" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button
              link
              type="primary"
              icon="Edit"
              @click="handleUpdate(scope.row)"
              v-hasPermi="['system:results:edit']"
          >修改</el-button>
          <el-button
              link
              type="primary"
              icon="Delete"
              @click="handleDelete(scope.row)"
              v-hasPermi="['system:results:remove']"
          >删除</el-button>
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
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Refresh, Plus, Edit, Delete, Download } from '@element-plus/icons-vue';
import { listResults, getResults, delResults, addResults, updateResults } from "@/api/routineExams/results";
import {useRoute} from "vue-router";
const route = useRoute();
// 数据状态
const loading = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const showSearch = ref(true);
const total = ref(0);
const resultsList = ref([]);
const title = ref("");
const open = ref(false);
const formRef = ref(null);
// 查询参数
console.log(route.query.examId)
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  userId: null,
  examId: route.query.examId,
  paperId: null,
  totalScore: null,
});

// 表单数据
const form = reactive({
  id: null,
  userId: null,
  examId: null,
  paperId: null,
  totalScore: null,
  createTime: null
});

// 表单验证规则
const rules = reactive({
  userId: [
    { required: true, message: "用户ID不能为空", trigger: "blur" }
  ],
  examId: [
    { required: true, message: "考试ID不能为空", trigger: "blur" }
  ],
  paperId: [
    { required: true, message: "试卷ID不能为空", trigger: "blur" }
  ],
  totalScore: [
    { required: true, message: "总分不能为空", trigger: "blur" }
  ],
});

// 生命周期钩子
onMounted(() => {
  getList();
});

// 方法定义
const getList = async () => {
  loading.value = true;
  try {
    const response = await listResults(queryParams);
    resultsList.value = response.rows;
    total.value = response.total;
  } finally {
    loading.value = false;
  }
};

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
</script>

<style scoped>
/* 可以添加自定义样式 */
</style>