<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="考试名称" prop="examName">
        <el-input
            v-model="queryParams.examName"
            placeholder="请输入考试名称"
            clearable
        />
      </el-form-item>
      <el-form-item label="开始时间" prop="startTime">
        <el-date-picker clearable
                        v-model="queryParams.startTime"
                        type="date"
                        value-format="yyyy-MM-dd"
                        placeholder="请选择开始时间">
        </el-date-picker>
      </el-form-item>
      <el-form-item label="结束时间" prop="endTime">
        <el-date-picker clearable
                        v-model="queryParams.endTime"
                        type="date"
                        value-format="yyyy-MM-dd"
                        placeholder="请选择结束时间">
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
            v-hasPermi="['system:exams:add']"
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
            v-hasPermi="['system:exams:edit']"
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
            v-hasPermi="['system:exams:remove']"
        >删除
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
            type="warning"
            plain
            icon="download"
            @click="handleExport"
            v-hasPermi="['system:exams:export']"
        >导出
        </el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
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
          <span>{{ formatExamStatus(row.examStatus) }}</span>
        </template>
      </el-table-column>
      <!-- 在el-table-column标签中修改应考人员列 -->
      <el-table-column label="应考人员" align="center" prop="candidateIds">
        <template #default="{ row }">
          <el-popover
              placement="right"
              :width="200"
              trigger="hover"
              popper-class="candidate-popover"
          >
            <el-table
                :data="
          JSON.parse(row.candidateIds || '[]')
            .map(id => ({
              name: userTreeData.find(u => u.userId == id)?.nickName || id
            }))
        "
                :height="200"
                border
                scrollbar-always-on
            >
              <el-table-column label="应考人员" prop="name" align="center"></el-table-column>
            </el-table>
            <template #reference>
              <div class="popover-reference">
                {{
                  JSON.parse(row.candidateIds || '[]')
                      .map(id => userTreeData.find(u => u.userId == id)?.nickName || id)
                      .join(',')
                }}
              </div>
            </template>
          </el-popover>
        </template>
      </el-table-column>
      <el-table-column label="实考人员" align="center" prop="attendeeIds">
        <template #default="{ row }"> <!-- 修正作用域参数 -->
          <el-popover
              placement="right"
              :width="300"
          trigger="hover"
          popper-class="attendance-popover"
          >
          <el-table
              :data="getAttendanceData(row)"
              :height="200"
              border
              scrollbar-always-on
          >
            <el-table-column label="应考人员" prop="name" align="center"></el-table-column>
            <el-table-column label="是否考试" align="center" width="100">
              <template #default="{ row: attendanceRow }"> <!-- 避免命名冲突 -->
                <el-tag :type="attendanceRow.attended ? 'success' : 'danger'">
                  {{ attendanceRow.attended ? '已参考' : '未参考' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
          <template #reference>
            <div class="popover-reference">
              {{
                safeParse(row.attendeeIds)
                    .map(id => userTreeData.find(u => u.userId == id)?.nickName || id)
                    .filter(name => name)
                    .join(', ') || '暂无实考人员'
              }}
            </div>
          </template>
          </el-popover>
        </template>
      </el-table-column>
      <el-table-column label="开始时间" align="center" prop="startTime" width="180">
      </el-table-column>
      <el-table-column label="结束时间" align="center" prop="endTime" width="180">
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="{ row }">
          <el-button
              link
              type="primary"
              icon="edit"
              @click="handleUpdate(row)"
              v-hasPermi="['system:exams:edit']"
          >修改
          </el-button>
          <el-button
              link
              type="primary"
              icon="delete"
              @click="handleDelete(row)"
              v-hasPermi="['system:exams:remove']"
          >删除
          </el-button>
          <el-button
              link
              type="primary"
              icon="EditPen"
              @click="startTest(row)"
              v-hasPermi="['system:exams:remove']"
          >开始考试
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
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="考试名称" prop="examName">
          <el-input v-model="form.examName" placeholder="请输入考试名称"/>
        </el-form-item>
        <el-form-item label="考试方式" prop="examType">
          <el-select
              v-model="form.examType"
              placeholder="请选择考试方式"
          >
            <el-option
                v-for="item in examTypeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="考试状态" prop="examStatus">
          <el-select
              v-model="form.examStatus"
              placeholder="请选择考试状态"
          >
            <el-option
                v-for="item in examStatusOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
            />
          </el-select>
        </el-form-item>
        <!-- 在el-form中添加 -->
        <el-form-item label="应考人员" prop="candidateIds">
          <div style="height: 200px; display: flex; flex-direction: column">
            <div style="margin-bottom: 10px; display: flex; gap: 10px">
              <el-checkbox
                  v-model="userNodeAll"
                  @change="handleUserTreeNodeAll"
              >全选</el-checkbox>
              <el-input
                  v-model="userNameKeyword"
                  placeholder="姓名搜索"
                  clearable
                  @input="handleUserSearch"
              ></el-input>
              <el-input
                  v-model="userIdKeyword"
                  placeholder="工号搜索"
                  clearable
                  @input="handleUserSearch"
              ></el-input>
            </div>
            <el-tree
                style="flex: 1; overflow-y: auto"
                class="tree-border"
                :data="userTreeData"
                show-checkbox
                ref="userTreeRef"
                node-key="userId"
                :props="{
        label: 'nickName',
        children: 'children'
      }"
                @check="handleUserCheck"
            >
              <template #default="{ node, data }">
                <span>{{ data.nickName }}（{{ data.userId }}）</span>
              </template>
            </el-tree>
          </div>
        </el-form-item>
        <el-form-item label="开始时间" prop="startTime">
          <el-date-picker clearable
                          v-model="form.startTime"
                          type="date"
                          placeholder="请选择开始时间">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="结束时间" prop="endTime">
          <el-date-picker clearable
                          v-model="form.endTime"
                          type="date"
                          placeholder="请选择结束时间">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="试卷选取" prop="paperId">
          <el-select
              v-model="form.paperId"
              placeholder="请选择试卷"
          >
            <el-option
                v-for="item in paperList"
                :key="item.id"
                :label="item.title"
                :value="item.id"
            />
          </el-select>
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
import {ref, reactive, onMounted, toRefs} from 'vue';
import {ElMessageBox, ElMessage} from 'element-plus';
import {listExams, getExams, delExams, addExams, updateExams, userWithRole} from "@/api/routineExams/exams";
import {listPaper} from "@/api/routineExams/paper";
import {useRouter} from "vue-router";

const loading = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const showSearch = ref(true);
const total = ref(0);
const examsList = ref([]);
const paperList = ref([]);
const title = ref("");
const open = ref(false);
const queryForm = ref(null);
const router = useRouter()
const userTreeData = ref([]);
const userTreeRef = ref(null);
const userNodeAll = ref(false);
const userNameKeyword = ref('');
const userIdKeyword = ref('');
const examAttendees = ref([])
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
        attendeeIds: null,
      },


      form: {
        examId: null,
        examName: null,
        startTime: null,
        endTime: null,
        paperId: null,
        examType: null,
        examStatus: null,
        candidateIds: null,
        attendeeIds: null,
        createTime: null
      },

      rules: {
        examName: [
          {required: true, message: "考试名称不能为空", trigger: "blur"}
        ],
        startTime: [
          {required: true, message: "开始时间不能为空", trigger: "blur"}
        ],
        endTime: [
          {required: true, message: "结束时间不能为空", trigger: "blur"}
        ],
        paperId: [
          {required: true, message: "试卷ID不能为空", trigger: "blur"}
        ],
        examType: [
          {required: true, message: "考试方式不能为空", trigger: "change"}
        ]
      },
      examTypeOptions: [
        {value: 0, label: '闭卷'},
        {value: 1, label: '开卷'}
      ],
      examStatusOptions: [
        {value: 0, label: '进行中'},
        {value: 1, label: '已结束'}
      ]
    }
);

const {queryParams, form, rules, examTypeOptions, examStatusOptions} = toRefs(data)
// 生命周期钩子
onMounted(() => {
  getList();
  loadUserData()
  listPaper().then(response => {
    paperList.value = response.rows;
  })
});
const loadUserData = async () => {
  try {
    const res = await userWithRole();
    userTreeData.value = (res.data || [])
        .filter(user => user.roles && user.roles.some(role =>
            role.roleKey && ['chief', 'physician'].includes(role.roleKey.toLowerCase())
        ))
        .map(user => ({
          userId: user.userId,
          nickName: user.nickName,
          userName: user.userName
        }));
  } catch (error) {
    console.error('加载用户数据失败:', error);
  }
};

const handleUserCheck = (checkedNodes, { checkedKeys }) => {
  form.value.candidateIds = checkedKeys;
};

// 处理全选
const handleUserTreeNodeAll = (val) => {
  const allKeys = userTreeData.value.map(user => user.userId);
  userTreeRef.value.setCheckedKeys(val ? allKeys : []);
};


function formatExamType(examType) {
  return examType === 0 ? '闭卷' : '开卷';
}

// 格式化考试状态
function formatExamStatus(examStatus) {
  return examStatus === 0 ? '进行中' : '已结束';

}

// 方法定义
function getList() {
  loading.value = true;
  listExams(queryParams.value).then(response => {
    examsList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  });
}

function handleQuery() {
  queryParams.pageNum = 1;
  getList();
}

function resetQuery() {
  queryForm.value.resetFields();
  handleQuery();
}

function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.examId);
  single.value = selection.length !== 1;
  multiple.value = !selection.length;
}

function handleAdd() {
  resetForm();
  open.value = true;
  title.value = "新增考试";
}

function handleUpdate(row) {
  resetForm();
  const examId = row.examId || ids.value;
  getExams(examId).then(response => {
    form.value = response.data; // 直接赋值给form.value
    open.value = true;
    title.value = "修改考试";
  });
}

function submitForm() {
  // 转换 candidateIds
  let candidateIds = form.value.candidateIds
  if (typeof candidateIds === 'string') {
    candidateIds = candidateIds.split(',').map(id => parseInt(id.trim(), 10))
  }
  form.value.candidateIds = JSON.stringify(candidateIds || []) // 处理空值

  // 转换 attendeeIds（如果也需要处理）
  let attendeeIds = form.value.attendeeIds
  if (typeof attendeeIds === 'string') {
    attendeeIds = attendeeIds.split(',').map(id => parseInt(id.trim(), 10))
  }
  form.value.attendeeIds = JSON.stringify(attendeeIds || []) // 处理空值

  if (form.value.examId) {
    updateExams(form.value).then(() => {
      ElMessage.success("修改成功")
      open.value = false
      getList()
    })
  } else {
    addExams(form.value).then(() => {
      ElMessage.success("新增成功")
      open.value = false
      getList()
    })
  }
}

function handleDelete(row) {
  const examIds = row.examId || ids.value;
  ElMessageBox.confirm(`是否确认删除考试编号为"${examIds}"的数据项？`, "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    return delExams(examIds);
  }).then(() => {
    getList();
    ElMessage.success("删除成功");
  });
}

function startTest(row) {
  try {
    // 跳转到目标页面，并传递试卷 ID
    console.log(row.id)
    router.push({
      name: 'NoticePage',
      query: {
        examId:row.examId,
        paperId: row.paperId// 传递试卷 ID
      }
    });
  } catch (error) {
    console.error('跳转失败:', error);
  }
}
const safeParse = (str) => {
  try {
    return JSON.parse(str || '[]')
  } catch (e) {
    console.error('解析失败:', e)
    return []
  }
}

function cancel() {
  open.value = false;
  resetForm();
}

function resetForm() {
  form.value = {
    examId: null,
    examName: null,
    startTime: null,
    endTime: null,
    paperId: null,
    examType: null,
    examStatus: null,
    candidateIds: null,
    attendeeIds: null,
    createTime: null
  };
  userTreeRef.value?.setCheckedKeys([]);
  userNameKeyword.value = '';
  userIdKeyword.value = '';
  userNodeAll.value = false;

}

function handleExport() {
  console.log(666)
}
const getAttendanceData = (row) => {
  try {
    // 使用安全解析方法处理 null 值
    const candidates = safeParse(row.candidateIds)
    const attendees = safeParse(row.attendeeIds)

    return candidates.map(userId => {
      const user = userTreeData.value.find(u => u.userId == userId)
      return {
        userId,
        name: user?.nickName || `未知用户（${userId}）`,
        attended: attendees.includes(userId)
      }
    })
  } catch (e) {
    console.error('数据解析失败:', e)
    return []
  }
}


</script>
<style scoped>
.popover-reference {
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>