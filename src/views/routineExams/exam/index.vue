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
                :class="{ 'selected-topic': isTopicSelected(groupIndex, num) }"
                @click="scrollToQuestion(groupIndex, num)"
            >
              {{ num }}
            </span>
          </div>
        </article>
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
              <el-icon size="16px" color="#aeaeae"><flag/></el-icon>
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
        <div class="countdown-time">剩余时间</div>
        <div class="progress-bar">答题进度</div>
      </div>
    </aside>
  </main>
</template>

<script setup>
import useUserStore from '@/store/modules/user';
import { ref, onMounted, computed, reactive } from 'vue';
import { useRoute } from 'vue-router';
import { listQuestionsByIds } from '@/api/routineExams/question';
import { getPaper } from '@/api/routineExams/paper';

const userStore = useUserStore();
const route = useRoute();
const questions = ref([]);

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

onMounted(async () => {
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
@media screen and (max-width: 1280px) {
  .test-main-content {
    padding: 100px 10px; /* 缩小 padding */
    gap: 10px; /* 缩小间距 */
  }

  .answer-sheet {
    width: 200px; /* 缩小宽度 */
  }

  .speed-box {
    width: 120px; /* 缩小宽度 */
  }
}

@media screen and (max-width: 768px) {
  .test-main-content {
    flex-direction: column; /* 改为垂直布局 */
    padding: 100px 10px;
  }

  .answer-sheet,
  .speed-box {
    width: 100%; /* 宽度占满 */
    margin-bottom: 20px; /* 增加间距 */
  }
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
  padding: 100px 20px; /* 调整 padding，留出左右空间 */
  min-height: 100vh; /* 至少占据整个视口的高度 */
  display: flex;
  justify-content: space-between; /* 左右两侧分别靠左和靠右 */
  gap: 20px; /* 左右两侧与中间内容的间距 */
}

.test-middle-content {
  background-color: #fff;
  flex: 1; /* 占据剩余空间 */
  padding: 15px 20px; /* 调整内边距 */
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); /* 添加阴影 */
  margin-left: 280px; /* 为答题卡留出空间 */
  margin-right: 180px; /* 为剩余时间留出空间 */
}

.test-main-content .answer-sheet {
  width: 260px; /* 固定宽度 */
  padding: 10px 8px 10px 15px;
  background-color: #fff; /* 背景色 */
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); /* 添加阴影 */
  position: fixed; /* 固定在页面上 */
  top: 100px; /* 距离顶部 100px（根据 header 高度调整） */
  left: 20px; /* 距离左侧 20px */
  z-index: 1000; /* 确保在最上层 */
}

.test-main-content .speed-box {
  width: 160px; /* 固定宽度 */
  padding: 10px;
  background-color: #fff; /* 背景色 */
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); /* 添加阴影 */
  position: fixed; /* 固定在页面上 */
  top: 100px; /* 距离顶部 100px（根据 header 高度调整） */
  right: 20px; /* 距离右侧 20px */
  z-index: 1000; /* 确保在最上层 */
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
  text-align: center;
  margin-bottom: 20px;
  padding-bottom: 30px;
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
  overflow-y: auto;
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
</style>