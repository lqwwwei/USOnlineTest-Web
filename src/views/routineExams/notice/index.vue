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
      <div class="avatar-container">
        <div class="avatar-wrapper">
          <img :src="userStore.avatar" class="user-avatar" alt="用户头像"/>
        </div>
      </div>
    </div>
  </header>


  <div class="notice">
    <div class="notice-content">
      <div class="notice-line"></div>
      <div class="notice-topic">
        <h1 style="font-size: 24px">{{ examInfo.examName }}</h1>
        <h2 class="text-shadow" style="font-size: 16px;margin-top: 10px">考试时间：从{{ examInfo.startTime }}至{{ examInfo.endTime }}</h2>
      </div>
      <div class="notice-line-bottom"></div>
      <div class="notice-tip">
        <div class="notice-title">
          <div class="notice-title-line"></div>
          <span>考试须知</span>
        </div>
        <p style="margin-top: 10px;">为了您能顺利地完成本次考试，请阅读并注意以下事项：</p>

        <!-- 考试环境 -->
        <p>一、考试环境</p>
        <p>1. 若在电脑上参加，请使用谷歌（Chrome）或Edge浏览器；若在移动端请确保电量充足。</p>
        <p>2. 考试前，请检查所有硬件设备、网络是否正常，确保硬件性能和网络稳定。</p>
        <p>3. 考试中因断电、关机等退出考试界面，请务必用上次参加时使用的软件（如谷歌浏览器、微信）打开链接或扫码，点击【继续考试】继续之前的作答。</p>
        <p>4. 请尽量选择一处相对安静、不易被打扰的环境。</p>

        <!-- 考试须知 -->
        <p>二、考试须知</p>
        <p>1. 考试有效时间从 {{ examInfo.startTime }} 至 {{ examInfo.endTime }}, 请务必在有效时间内参加。</p>
        <p>2. 考试卷面满分为100.0分，及格分数线：60.0分。</p>
        <p>3. 允许考生参加100次，答题限时为20分钟，系统采用倒计时方式。</p>

        <!-- 考场纪律 -->
        <p>三、考场纪律</p>
        <p>考生应知悉，在整个考试过程上，考生应承诺自觉遵守考试纪律，并知悉以下行为将会被认定违反考试纪律或作弊行为。违纪考生将视为违纪并取消成绩。</p>
        <p>1. 不允许出现伪造资料、身份信息等，替代他人或委托他人代为参加考试的行为。</p>
        <p>2. 考试全程不允许出现翻看书籍、资料或使用手机、计算器、平板电脑等与考试无关的行为。</p>
        <p>3. 考试全程不允许以任意方式(包括但不限于抄录、截图摄屏、视频记录等行为)记录或传播考试过程及试题。</p>
        <p>4. 考试全程不允许出现与考试内容相关的讨论、对话等声音。</p>
        <p>本次考试试题属于机密内容，不得对外泄露。如发现有通过摄屏、拍照并在互联网传播等渠道泄露试题的行为，将取消考生本次考试成绩并依法追究相关法律责任。</p>
      </div>
      <div class="checkbox" style="margin-top: 20px;">
        <input type="checkbox" id="agreeToNotice" v-model="agreeToNotice">
        <label for="agreeToNotice" style="color: #808080;">我已阅读考试须知</label>
      </div>

      <button @click="handleClick">开始考试</button>

      <p v-show="!agreeToNotice && showError" class="error-message">请先阅读并同意考试须知。</p>
    </div>
  </div>
</template>
<script setup>
import {getUserProfile} from "@/api/system/user";
import {onMounted, ref} from "vue";
import {useRoute, useRouter} from 'vue-router';
import{getExams} from "@/api/routineExams/exams";
import useUserStore from "@/store/modules/user";
const userStore = useUserStore();
const nickName = ref('')
const agreeToNotice = ref(false);
const showError = ref(false);
const router = useRouter()
const route = useRoute();
const examInfo = ref('')
const examId = ref(route.query.examId)
function getUser() {
  return getUserProfile().then((response) => {
    nickName.value = response.data.nickName
  })
}
function handleClick() {
  if (!agreeToNotice.value) {
    showError.value = true;
  } else {
    // 执行开始考试的逻辑
    try {
      // 跳转到目标页面，并传递试卷 ID
      router.push({
        name: 'ExamPage',
        query: {
          examId:route.query.examId,
          paperId: route.query.paperId // 传递试卷 ID
        }
      });
    } catch (error) {
      console.error('跳转失败:', error);
    }
  }
}
onMounted(async () => {
  await getUser();
  await getExams(examId.value).then(response => {
    examInfo.value = response.data; // 直接赋值给form.value
  });
})
</script>
<style scoped>
*{
  padding: 0;
  margin: 0;
}
:root{
  --avatar-size: 40px;
  --border-color: #e7e7e7;
  --shadow-color: rgba(142, 155, 165, 0.3);
}
.text-shadow{
  color: #AAAAAA;
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
  width: 40px;
  height: 40px;
  border-radius: 10px;
}
.notice{
  height: 1200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #F5F5F5;
}
.notice-content{
  margin-top:8rem ;
  width: 800px;
  height: 900px;
  background-color: #FFFFFF;
  box-shadow: 0 10px 30px -10px var(--shadow-color);
  display: flex;
  flex-direction: column;
  align-items: center;
}
.notice-line{
  width:100%;
  height: 8px;
  background-color:#128beb;
}
.notice-line-bottom{
  margin-top:30px ;
  width: 36px;
  height: 4px;
  background-color:#FF851B;
}
.notice-topic{
  margin-top:50px ;
  display: flex;
  flex-direction: column;
  justify-content: center; /* 水平居中 */
  align-items: center; /* 垂直居中 */
}
.notice-tip{
  width: 600px;
  display: flex;
  margin-top: 20px;
  flex-direction: column;
}
.notice-title {
  display: flex;
  align-items: center; /* 垂直居中 */
}
.notice-title-line{
  height: 100%;
  width: 2px;
  background-color: #1c84c6;
  margin-right: 5px;
}
.notice-tip ol, .notice-tip p {
  margin-top: 10px;
  margin-left: 20px; /* 根据需要调整缩进 */
  color: #808080;
  font-size: 14px;
}

.checkbox {
  display: flex;
  align-items: center;
}

.checkbox input[type="checkbox"] {
  margin-right: 10px; /* 增加复选框与文本之间的间距 */
}

 button {
  margin-top: 10px;
  margin-bottom: 20px;
  padding: 10px 20px;
  background-color: #128beb;
  color: white;
  border: none;
  cursor: pointer;
  font-size: 16px;
  width: 400px;
}
.error-message {
  color: red;
  margin-top: 5px;
  font-size: 14px;
}
</style>