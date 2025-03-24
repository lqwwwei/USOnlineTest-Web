<template>
  <header class="Exam-header">
    <div class="Exam-header-left">
      <el-icon size="32px" color="hsl(212, 87%, 30%)">
        <HomeFilled/>
      </el-icon>
      <span class="Dividing-Line"></span>
      <div>考试名称</div>
    </div>
    <div class="Exam-header-right">
      <div class="status-box">
        <div class="status-text">{{ nickName }}</div>
      </div>
      <div class="status-box">
        <div class="status-text" style="color: #1c80f2">考试中</div>
      </div>
      <div class="avatar-container">
        <div class="avatar-wrapper">
          <img :src="userStore.avatar" class="user-avatar" alt="用户头像"/>
        </div>
      </div>
    </div>
  </header>
  <main class="test-main-content">
    <aside class="answer-sheet">
      <h1>答题卡</h1>
      <div class="title-line"></div>
      <div class="test-paper-middlebox">
        <article v-for="(group, groupIndex) in questionNumberMap" :key="group.type">
          <p>
            {{ group.name }}
            <span class="answersheet-subtitle">
              (共{{ group.end - group.start + 1 }}题，{{ group.totalScore }}分)
            </span>
          </p>
          <div class="topic-box ksy-flex">
 <span
     v-for="num in Array.from({ length: group.end - group.start + 1 }, (_, i) => group.start + i)"
     :key="num"
     :class="{
    'selected-topic': isTopicSelected(groupIndex, num),
    'flagged-topic': isTopicFlagged(groupIndex, num)
  }"
     @click="scrollToQuestion(groupIndex, num)"
 >
  <template v-if="isTopicFlagged(groupIndex, num)">
    <el-icon size="12" color="#ff4d4f">
      <Flag />
    </el-icon>
  </template>
  <template v-else>
    {{ num }}
  </template>
</span>
          </div>
        </article>
      </div>
      <div class="topic-sign">
        <div class="legend-container">
          <div class="legend-item">
            <span class="legend-icon"></span>
            未答题
          </div>
          <div class="legend-item">
            <span class="legend-icon selected-topic"></span>
            已作答
          </div>
          <div class="legend-item">
            <el-icon size="12px" color="#ff4d4f"><flag/></el-icon>
            已标记
          </div>
        </div>
      </div>
    </aside>
    <section class="test-middle-content">
      <div id="content">
        <article
            class="subject-box"
            v-for="(group, groupIndex) in groupedQuestions"
            :key="group.type"
        >
          <div class="subject-topic">
            <p>
              <span>第 {{ groupIndex + 1 }} 大 题 、{{ group.name }}</span>
              <span class="answersheet-subtitle">
                （共{{ group.questions.length }}题，{{ group.questions.length * 5 }}分）
              </span>
            </p>
          </div>
          <div
              class="subject-test margin-number"
              v-for="(question, index) in group.questions"
              :key="question.id"
              :id="`question-${groupIndex}-${questionNumberMap[groupIndex].start + index}`"
          >
            <span class="subject-test-text">
              <span class="ksy_s">{{ questionNumberMap[groupIndex].start + index }}.</span>
              {{ question.content }}
            </span>
            <span class="subject-test-box">
              <p class="question-score">{{ group.name }}5.0分</p>
              <el-icon class="flag-icon" size="16px" :color="question.flagged ? '#ff4d4f' : '#aeaeae'"  @click="toggleFlag(question)"><flag/></el-icon>
            </span>
            <div class="select-project-box">
              <ul>
                <li
                    class="ksy_flex"
                    v-for="(option, key) in getOptions(group.type)"
                    :key="key"
                    @click="selectOption(question, group.type, key)"
                >
                  <span
                      class="option-strong"
                      :class="{ 'selected-option': isOptionSelected(question, group.type, key) }"
                  >
                    {{ getOptionLabel(group.type, key) }}
                  </span>
                  <span class="select-content">
                    {{ getOptionContent(question, group.type, key) }}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </article>
      </div>
    </section>
    <aside class="speed-box">
      <div class="schedule-time">
        <div class="countdown-time"><span>剩余时间</span><br><span class="time-col">19分44秒</span></div>
        <div class="progress-bar">
          <p>答题进度</p>
          <div class="progress-text"><span>{{ answeredCount }}/{{ totalQuestions }}</span></div>
          <el-progress
              :percentage="progressPercentage"
              :stroke-width="8"
              :show-text="false"
          />
        </div>
      </div>
      <el-button type="primary" class="test-end">交卷</el-button>
    </aside>
  </main>
</template>

<script setup>
import useUserStore from '@/store/modules/user';
import { ref, onMounted, computed, reactive } from 'vue';
import { useRoute } from 'vue-router';
import { listQuestionsByIds } from '@/api/routineExams/question';
import { getPaper } from '@/api/routineExams/paper';
import {getUserProfile} from "@/api/system/user";

const userStore = useUserStore();
const route = useRoute();
const questions = ref([]);
const nickName = ref('')
const progressPercentage = computed(() => {
  return totalQuestions.value === 0
      ? 0
      : Math.round((answeredCount.value / totalQuestions.value) * 100);
});

// 按题型分组试题
const groupedQuestions = computed(() => {
  const groups = {
    0: { type: 0, name: '单选题', questions: [] },
    1: { type: 1, name: '判断题', questions: [] },
    2: { type: 2, name: '多选题', questions: [] }
  };
  questions.value.forEach(question => {
    if (groups[question.type]) {
      groups[question.type].questions.push(question);
    }
  });
  return Object.values(groups).filter(group => group.questions.length > 0);
});

// 生成答题卡题号映射
const questionNumberMap = computed(() => {
  let count = 0;
  const map = [];
  groupedQuestions.value.forEach(group => {
    const start = count + 1;
    const end = count + group.questions.length;
    map.push({
      type: group.type,
      name: group.name,
      start,
      end,
      totalScore: group.questions.length * 5
    });
    count = end;
  });
  return map;
});

// 获取选项
const getOptions = (type) => {
  return type === 1 ? [0, 1] : ['A', 'B', 'C', 'D'];
};

// 获取选项标签
const getOptionLabel = (type, key) => {
  if (type === 1) {
    // 判断题显示 T/F
    return key === 0 ? 'T' : 'F';
  }
  return String.fromCharCode(65 + key); // 其他题型显示 A/B/C/D
};

// 获取选项内容
const getOptionContent = (question, type, key) => {
  if (type === 1) {
    return key === 0 ? question.optionA : question.optionB;
  } else {
    return question[`option${String.fromCharCode(65 + key)}`];
  }
};

// 判断选项是否选中
const isOptionSelected = (question, type, key) => {
  const option = String.fromCharCode(65 + key);
  if (type === 2) {
    return question.selectedOptions?.includes(option);
  } else {
    return question.selected === option;
  }
};

// 判断答题卡格子是否选中
const isTopicSelected = (groupIndex, num) => {
  const questionIndex = num - questionNumberMap.value[groupIndex].start;
  const question = groupedQuestions.value[groupIndex].questions[questionIndex];
  if (!question) return false;

  if (question.type === 2) {
    return question.selectedOptions?.length > 0;
  } else {
    return !!question.selected;
  }
};
// 切换标记状态的方法
const toggleFlag = (question) => {
  question.flagged = !question.flagged;
};

// 判断是否被标记的方法
const isTopicFlagged = (groupIndex, num) => {
  const questionIndex = num - questionNumberMap.value[groupIndex].start;
  const question = groupedQuestions.value[groupIndex].questions[questionIndex];
  return question?.flagged || false;
};

const totalQuestions = computed(() => {
  return questionNumberMap.value.reduce((total, group) =>
      total + (group.end - group.start + 1), 0);
});

const answeredCount = computed(() => {
  return questions.value.reduce((count, question) => {
    if (question.type === 2) {
      return question.selectedOptions?.length > 0 ? count + 1 : count;
    }
    return question.selected ? count + 1 : count;
  }, 0);
});

// 选择选项
const selectOption = (question, type, key) => {
  const option = String.fromCharCode(65 + key);
  if (type === 2) {
    if (!question.selectedOptions) question.selectedOptions = [];
    const index = question.selectedOptions.indexOf(option);
    if (index === -1) {
      question.selectedOptions.push(option);
    } else {
      question.selectedOptions.splice(index, 1);
    }
  } else {
    question.selected = question.selected === option ? null : option;
  }
};

// 滚动到对应题目
const scrollToQuestion = (groupIndex, num) => {
  const questionId = `question-${groupIndex}-${num}`;
  const element = document.getElementById(questionId);
  if (element) {
    // 获取导航栏高度
    const header = document.querySelector('.Exam-header');
    const headerHeight = header ? header.clientHeight : 0;

    // 计算目标位置
    const elementTop = element.offsetTop - headerHeight;

    // 平滑滚动
    window.scrollTo({
      top: elementTop,
      behavior: 'smooth'
    });
  }
};
function getUser() {
  return getUserProfile().then((response) => {
    nickName.value = response.data.nickName
  })
}

onMounted(async () => {
  await getUser();
  const examId = route.query.examId;
  if (examId) {
    try {
      const paperResponse = await getPaper(examId);
      const paperData = paperResponse.data;
      const questionIds = paperData.questionIds;

      if (questionIds?.length > 0) {
        const idsArray = typeof questionIds === 'string'
            ? questionIds.split(',').map(Number)
            : questionIds;

        const questionsResponse = await listQuestionsByIds(idsArray);
        questions.value = questionsResponse.data.map(q => reactive({
          ...q,
          selected: null,
          flagged: false, // 新增标记属性
          selectedOptions: q.type === 2 ? [] : undefined
        }));
      }
    } catch (error) {
      console.error('获取数据失败:', error);
    }
  }
});
</script>



<style>
*{
  padding: 0;
  margin: 0;
  box-sizing: border-box;
}
aside {
  display: block;
  unicode-bidi: isolate;
  background: none; /* 移除背景颜色 */
}
.margin-number {
  margin: 20px 0;
}
.ksy_flex{
  display: flex;
}
.selected-topic {
  background-color: #c2e4ff !important;
}

/* 选项选中样式 */
.option-strong.selected-option {
  background-color: #128beb !important;
  color: white !important;
  border-radius: 50%;
}

/* 基础样式 */
.topic-box span {
  display: inline-block;
  width: 35px;
  height: 35px;
  line-height: 35px;
  text-align: center;
  margin: 5px;
  border: 1px solid #ddd;
  cursor: pointer;
}

.subject-test {
  margin: 20px 0;
  padding: 15px;
  border: 1px solid #eee;
}

:root {
  --primary-color: hsl(212, 87%, 30%);
  --border-color: #e7e7e7;
  --shadow-color: rgba(142, 155, 165, 0.3);
  --avatar-size: 40px;
}

.Exam-header {
  height: 5rem;
  width: 100%;
  position: fixed;
  background: #fff;
  padding: 0 1.5rem;
  box-shadow: 0 10px 30px -10px var(--shadow-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 1000; /* 提高 z-index 值 */
}

.Exam-header-left,
.Exam-header-right {
  display: flex;
  align-items: center;
}
.status-box {
  margin-right: 12px;
  min-width: 2rem;
  max-height: 1.5rem;
  padding: 0.25rem 0.75rem 0.25rem 0.75rem;
  background-color: #f6f7f9;
  border-radius: 0.75rem;
  white-space: nowrap;
}
.status-text {
  color: hsl(0, 0%, 45%);
  font-size: 0.8125rem;
  line-height: 1rem;
}

.Dividing-Line {
  width: 2px;
  height: 1.875rem;
  background: var(--border-color);
  margin: 0 0.625rem;
}

.avatar-container {
  margin-right: 40px;
}

.avatar-wrapper {
  margin-top: 5px;
  position: relative;
}

.user-avatar {
  cursor: pointer;
  width: var(--avatar-size);
  height: var(--avatar-size);
  border-radius: 10px;
}

.test-main-content {
  padding: 100px 200px;
  min-height: 100vh;
  display: flex;
  justify-content: space-between;
  gap: 20px;
}

.test-middle-content {
  background-color: #fff;
  flex: 1;
  padding: 15px 20px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  /* 动态计算边距 */
  margin-left: calc(260px + 20px); /* 答题卡宽度 + 间距 */
  margin-right: calc(160px + 20px); /* 进度框宽度 + 间距 */
}

.test-main-content .answer-sheet {
  background-color: #fff;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  width: 280px;
  /* 修改高度为自适应 */
  min-height: 690px;  /* 最小高度 */
  position: fixed;
  left: 180px;
  top: 100px;
  display: flex;
  flex-direction: column; /* 弹性布局管理内部内容 */
}

.test-main-content .speed-box {
  width: 160px;
  position: fixed;
  right: 200px; /* 与父容器的padding-left对应 */
  top: 100px;
  padding: 0;
  margin: 0;
}

@media screen and (max-width: 1680px) {
  .test-main-content {
    padding: 100px 100px;
  }
  .test-main-content .answer-sheet {
    left: 100px;
  }
  .test-main-content .speed-box {
    right: 100px;
  }
  .test-middle-content {
    margin-left: calc(260px + 10px);
    margin-right: calc(160px + 10px);
  }
}

@media screen and (max-width: 1280px) {
  .test-main-content {
    padding: 100px 40px;
  }
  .test-main-content .answer-sheet {
    left: 40px;
    width: 220px;
  }
  .test-main-content .speed-box {
    right: 40px;
    width: 120px;
  }
  .test-middle-content {
    margin-left: calc(220px + 10px);
    margin-right: calc(120px + 10px);
  }
}

@media screen and (max-width: 1024px) {
  .test-main-content {
    padding: 100px 20px;
    flex-direction: column;
  }
  .test-main-content .answer-sheet,
  .test-main-content .speed-box {
    position: static;
    width: 100%;
    margin: 0 0 20px;
  }
  .test-middle-content {
    margin: 0;
    order: 1;
  }
}
.title-line {
  background-color: var(--border-color);
  width: 100%;
  height: 1px;
}

.answer-sheet h1 {
  font-size: 18px;
  width: 80px;
  margin: -1px auto;
  text-align: center;
  padding: 5px 0;
}

.schedule-time {
  background-color: #FFFFFF;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  text-align: center;
  margin-bottom: 20px;
  padding: 10px 8px 10px 15px;
}

.subject-box {
  padding: 0 25px;
}

.subject-topic p {
  line-height: 25px;
  text-align: justify;
  border-bottom: 1px solid var(--border-color);
  padding: 14px 0;
}

.answersheet-subtitle {
  color: #949494;
  margin-left: 6px;
  font-size: 12px;
}

.subject-test-text {
  line-height: 25px;
  text-align: justify;
}

.ksy_s {
  color: #128beb;
  margin-right: 6px;
  vertical-align: baseline; /* 修改为 baseline */
  line-height: 22px;
}

.subject-test-box {
  margin-top: 10px; /* 增加上边距，与题目内容分开 */
}

.question-score {
  background-color: #f4f4f4;
  border-radius: 15px;
  padding: 2px 8px;
  color: #9d9d9d;
  margin-left: 6px;
  font-size: 12px;
  display: inline-block;
  vertical-align: middle; /* 将文本和图标垂直居中对齐 */
  margin-right: 6px; /* 调整间距 */
}

.subject-test-box .el-icon {
  vertical-align: middle; /* 将图标垂直居中对齐 */
}
.option-strong{
  border-radius: 50%;
}
.option-strong, .option-strong-square {
  flex: 0 0 28px;
  line-height: 26px;
  border: 1px solid #a7a7a7;
  color: #a7a7a7;
  background-color: #ffffff;
  text-align: center;
  cursor: pointer;
}
.select-content{
  line-height: 22px;
  margin-left: 20px;
}
.test-paper-middlebox{
  flex: 1;
  overflow-y: auto;
  height: 100%;
  margin-top: 10px;
}
.test-paper-middlebox .topic-box {
  flex-wrap: wrap;
  justify-content: flex-start;
  box-sizing: border-box;
  margin: 10px 0;
  width: 100%;
  overflow: hidden;
}
.topic-sign {
  border-top: 1px solid #e7e7e7;
  padding: 10px 0;
  width: 100%;
  margin-top: 20px;
  background-color: #fff; /* 背景色 */
}

.legend-container {
  display: flex;
  gap: 20px; /* 图例间距 */
  padding: 10px 0;
}

.legend-item {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #666;
}

.legend-icon {
  display: inline-block;
  width: 24px;
  height: 24px;
  border: 1px solid #ddd; /* 默认灰色边框 */
  border-radius: 4px;
  margin-right: 8px;
  background-color: #cecece;
}

.legend-icon.selected-topic {
  background-color: #c2e4ff; /* 已作答背景色 */
  border-color: #c2e4ff; /* 边框颜色与背景一致 */
}
.topic-box span{
  flex: 0 0 15.2%;
 width: 35px;
  height: 35px;
  line-height: 35px;
  border-radius: 3px;
  border: 1px solid #cecece;
  background-color: #f4f4f4;
  color: #acacac;
  text-align: center;
  display: inline-block;
  margin: 0 10px 10px 0;
  cursor: pointer;
}
ul, li {
  list-style: none;
}
.select-project-box>ul>li {
  line-height: 28px;
  color: #666666;
  align-items: center;
  align-content: center;
  margin: 10px 0px 5px 0px;
  cursor: pointer;
}
.countdown-time{
  border-bottom: 1px dashed #e7e7e7;
}
.time-col{
  color: #e81515;
}
.progress-bar{
  padding-bottom: 30px;
}
.progress-bar p{
  margin-top: 5px;
}
.progress-bar span {
  margin-bottom: 10px;
  display: block;
}
.test-end{
  width: 100%;
  text-align: center;
  height: 45px;
  border-radius: 5px;
  cursor: pointer;
  background-color: #128beb;
  color: #FFFFFF;
}
/* 标记图标样式 */
.flag-icon {
  cursor: pointer;
}

</style>