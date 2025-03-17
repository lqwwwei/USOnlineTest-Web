<template>
  <div class="app-container">
    <!-- 搜索表单 -->
    <el-form :model="queryParams" ref="queryForm" :inline="true" v-show="showSearch" label-width="100px">
      <el-form-item label="知识点名称" prop="name">
        <el-input
            v-model="queryParams.name"
            placeholder="请输入知识点名称"
            clearable
            @keyup.enter="handleQuery"
        />
      </el-form-item>

      <el-form-item label="创建时间" prop="createdAt">
        <el-date-picker
            v-model="queryParams.createdAt"
            type="date"
            value-format="yyyy-MM-dd"
            placeholder="请选择创建时间"
            clearable
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="search" @click="handleQuery">搜索</el-button>
        <el-button icon="refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 操作按钮 -->
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
            type="primary"
            plain
            icon="plus"
            @click="handleAdd"
            v-hasPermi="['system:point:add']"
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
            v-hasPermi="['system:point:edit']"
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
            v-hasPermi="['system:point:remove']"
        >删除
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
            type="warning"
            plain
            icon="download"
            @click="handleExport"
            v-hasPermi="['system:point:export']"
        >导出
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <!-- 树形表格 -->
    <el-table
        v-loading="loading"
        :data="treePointList"
        row-key="id"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" align="center"/>
      <!--      <el-table-column label="知识点ID" align="center" prop="id" />-->
      <el-table-column label="知识点名称" align="center" prop="name"/>
      <el-table-column label="父级知识点ID" align="center" prop="parentId"/>
      <el-table-column label="创建时间" align="center" prop="createdAt" width="180">
        <template #default="{ row }">
          <span>{{ formatDate(row.createdAt) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="{ row }">
          <el-button
              link
              type="primary"
              @click="handleAdd(row)"
              v-hasPermi="['system:point:add']"
          >新增
          </el-button>
          <el-button
              link
              type="primary"
              @click="handleUpdate(row)"
              v-hasPermi="['system:point:edit']"
          >修改
          </el-button>
          <el-button
              link
              type="primary"
              @click="handleDelete(row)"
              v-hasPermi="['system:point:remove']"
          >删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页组件 -->
    <pagination
        v-show="total > 0"
        :total="total"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        @pagination="getList"
    />
    <!-- 新增/修改对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="pointform" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="知识点" prop="name">
          <el-input v-model="form.name" placeholder="请输入知识点名称"/>
        </el-form-item>
        <el-form-item label="父级" prop="parentId">
          <el-select v-model="form.parentId" placeholder="请选择父级知识点">
            <el-option
                v-for="item in pointList"
                :key="item.id"
                :label="item.name"
                :value="item.id">
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="创建时间" prop="createdAt">
          <el-date-picker
              clearable
              v-model="form.createdAt"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="请选择创建时间"
          />
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
import {ref, reactive, onMounted} from 'vue';
import {listPoint, getPoint, delPoint, addPoint, updatePoint} from '@/api/routineExams/point';
import {ElMessage, ElMessageBox} from 'element-plus';


// 状态管理
const loading = ref(true);
const showSearch = ref(true);
const pointList = ref([]); // 原始数据
const treePointList = ref([]); // 树形数据
const total = ref(0);
const open = ref(false);
const title = ref('');
const single = ref(true);
const multiple = ref(true);
const ids = ref([]);

// 查询参数
const data = reactive({
   queryParams:{
    pageNum: 1,
    pageSize: 10,
    name: null,
    parentId: null,
    level: null,
    path: null,
    createdAt: null,
  },

// 表单数据
   form:{
    id: null,
    name: null,
    parentId: null,
    level: null,
    path: null,
    createdAt: null,
  },

// 表单校验规则
   rules :{
    name: [{required: true, message: '知识点名称不能为空', trigger: 'blur'}],
    level: [{required: true, message: '层级深度不能为空', trigger: 'blur'}],
  }
})
const { queryParams, form, rules } = toRefs(data)
// 初始化加载数据
onMounted(() => {
  getList();
});

// 查询列表
const getList = async () => {
  loading.value = true;
  try {
    const res = await listPoint(queryParams);
    pointList.value = res.rows;
    total.value = res.total;
    // 将平铺数据转换为树形结构
    treePointList.value = buildTree(pointList.value);
  } catch (error) {
    ElMessage.error('获取数据失败');
  } finally {
    loading.value = false;
  }
};

// 构建树形结构
const buildTree = (data) => {
  const map = {};
  const tree = [];

  // 将数据存储到 map 中
  data.forEach((item) => {
    map[item.id] = {...item, children: []};
  });

  // 构建树形结构
  data.forEach((item) => {
    if (item.parentId) {
      map[item.parentId].children.push(map[item.id]);
    } else {
      tree.push(map[item.id]);
    }
  });

  return tree;
};

// 搜索
function handleQuery(queryParams)  {
  queryParams.pageNum = 1;
  getList();
}

// 重置搜索
function resetQuery() {
  handleQuery();
}

// 多选框选中
const handleSelectionChange = (selection) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length !== 1;
  multiple.value = !selection.length;
};

// 新增
function handleAdd(){
  reset()
  open.value = true;
  title.value = '新增知识点';
}

// 修改
async function handleUpdate(row) {
  reset();
  const id = row.id || ids.value[0];
  try {
    const res = await getPoint(id);
    // 确保使用 .value 来更新响应式对象
    Object.assign(form.value, res.data);
    open.value = true;
    title.value = '修改知识点';
  } catch (error) {
    ElMessage.error('获取数据失败');
  }
}

// 删除
async function handleDelete(row) {
  const id = row.id || ids.value;
  try {
    await ElMessageBox.confirm('是否确认删除选中的数据项？', '提示', {type: 'warning'});
    await delPoint(id);
    ElMessage.success('删除成功');
    await getList();
  } catch (error) {
    ElMessage.info('取消删除');
  }
}

// 提交表单
async function submitForm()  {
  try {
    if (form.value.id) {
      await updatePoint(form.value);
      ElMessage.success('修改成功');
    } else {
      await addPoint(form.value);
      ElMessage.success('新增成功');
    }
    open.value = false;
    getList();
  } catch (error) {
    ElMessage.error('操作失败');
  }
}

// 重置表单
function reset() {
  form.value = {
    id: null,
    name: null,
    parentId: null,
    level: null,
    path: null,
    createdAt: null,
  }
}

// 取消
function cancel () {
  open.value = false;
  reset()
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString();
};
</script>

<style scoped>

</style>
