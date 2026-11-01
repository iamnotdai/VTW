import { PROFILE_NAME_MAX_LENGTH } from '@/config/app';

/** Profile Setup, Settings and Journey. */
export const profile: Record<string, string> = {
  // Journey (screen 02)
  'A cozy, sunny village with a path that leads out to the wide world.':
    '一个温暖又阳光的小村庄，一条小路通向广阔的世界。',
  // Course picker (top of Profile Setup, Settings)
  'I want to learn': '我想学',
  Course: '课程',
  'Each course keeps its own progress.': '每门课程的学习进度分开保存。',
  // Profile Setup (screen 01)
  'Create your profile': '创建你的资料',
  'Welcome to': '欢迎来到',
  'Let’s set up your learning profile.': '我们来设置你的学习资料吧。',
  'Start My Journey': '开始我的旅程',
  // Profile fields (Profile Setup and Settings)
  'Full Name': '你的名字',
  'Type your name': '输入你的名字',
  'Age Group': '年龄',
  'Choose your age group': '选择你的年龄',
  '{label} years': '{label}',
  'Under 6': '6岁以下',
  '6–8': '6–8',
  '9–12': '9–12',
  '13–17': '13–17',
  '18+': '18+',
  'Can you type words?': '你会打字吗？',
  'Yes, I can type words': '会，我会打字',
  'Not yet, I prefer choosing answers': '还不会，我想选答案',
  'Profile Picture': '头像',
  Boy: '男孩',
  Girl: '女孩',
  'Your picture': '你的头像',
  'Change Photo': '换头像',
  'Choose your picture': '选择你的头像',
  // Messages of validateProfileForm (src/lib/profile.ts), translated where they are shown
  'Please enter your name.': '请输入你的名字。',
  [`Your name can be up to ${PROFILE_NAME_MAX_LENGTH} characters.`]: `名字最多${PROFILE_NAME_MAX_LENGTH}个字。`,
  'Please choose your age group.': '请选择你的年龄。',
  'Please choose one answer.': '请选一个答案。',
  'Please choose your character.': '请选择你的头像。',
  // Settings (screen 16)
  'Manage your profile and learning preferences.': '管理你的资料和学习设置。',
  'Save Changes': '保存修改',
  'Your changes are saved.': '修改已经保存好了。',
  'Saved for now, but this browser could not store it.': '暂时保存了，但这个浏览器没能把它存下来。',
  'This browser is blocking storage, so your progress will be lost when you close the app.':
    '这个浏览器不让保存数据，关掉应用后，你的进度会丢失。',
  'Your profile and progress are saved in this browser on this device only.':
    '你的资料和进度只保存在这台设备的这个浏览器里。',
  // Settings › Reading voice
  'Reading voice': '朗读声音',
  'Voice style': '声音类型',
  Automatic: '自动',
  'Boy voice': '男孩声音',
  'Girl voice': '女孩声音',
  'American English voice for words and sentences': '朗读词语和句子的普通话声音',
  'Automatic (best available)': '自动（选最好的）',
  'Hear this voice': '听一听这个声音',
  'Hello! This is how I sound.': '你好！我的声音是这样的。',
  'This browser cannot read words aloud, so there is no voice to choose.':
    '这个浏览器不能朗读，所以没有声音可以选。',
  'No American English voice was found on this device, so the browser default is used.':
    '这台设备上没有普通话声音，所以会用浏览器默认的声音。',
};
