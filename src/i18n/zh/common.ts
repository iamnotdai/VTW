/** Shared copy: app shell, menu, scene groups and buttons used on many screens. */
export const common: Record<string, string> = {
  // Main menu (spec §2.1)
  Journey: '旅程',
  Vocabulary: '词汇',
  Conversation: '对话',
  Settings: '设置',
  // Scene groups
  Home: '家',
  Garden: '庭院',
  Village: '村庄',
  School: '学校',
  Town: '小镇',
  // App shell: sidebar, bottom navigation, top bar
  'Skip to content': '跳到主要内容',
  Main: '主菜单',
  'Expand menu': '展开菜单',
  'Collapse menu': '收起菜单',
  'Level {level}': '等级 {level}',
  '{name}, Level {level} — open Settings': '{name}，等级 {level}——打开设置',
  Breadcrumb: '页面路径',
  Back: '返回',
  // Audio buttons
  'Sound is off in Settings': '声音在设置里关掉了',
  Stop: '停止',
  // Explore picture: objects, hint bubble, zoom buttons
  '{title} scene': '{title}场景',
  'Objects in the picture': '图片里的东西',
  '{word} — found. Press Enter to review.': '{word}——找到了。按回车键复习。',
  'Object {number} — not found yet. Press Enter to learn it.':
    '第{number}个东西——还没找到。按回车键学习。',
  'You found everything!': '你全都找到啦！',
  'Tap an object, then tap Learn!': '点一个东西，再点“学习”！',
  'Click on an object!': '点一点图里的东西！',
  'What is this?': '这是什么？',
  'Press Enter to learn!': '按回车键学习！',
  Learn: '学习',
  Review: '复习',
  Zoom: '缩放',
  'Reset zoom': '恢复原来大小',
  'Zoom in': '放大',
  'Zoom out': '缩小',
  'Full screen': '全屏',
  'Exit full screen': '退出全屏',
  // Not found, coming soon and error pages
  'Not found': '找不到页面',
  'Coming soon': '即将推出',
  'We can’t find this place': '我们找不到这个地方',
  'This page does not exist. Let’s go back and keep exploring!':
    '这个页面不存在。我们回去继续探索吧！',
  '{title} is coming soon': '{title}即将推出',
  'We are still building this place. Try the Bedroom for now!': '这里还在建设中。先去卧室看看吧！',
  'Go to Vocabulary': '去学词汇',
  'Go to Conversations': '去看对话',
  'Oops! Something went wrong': '哎呀！出了点问题',
  'Please try again. Your progress is safe on this device.':
    '请再试一次。你的学习进度还好好地保存在这台设备上。',
  Reload: '重新加载',
};
