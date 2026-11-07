/** Conversation screens: scene list, player, transcript, speaking practice and result. */
export const conversation: Record<string, string> = {
  // Also used here, from common.ts: Conversation, Coming soon, Stop, Full screen, Exit full screen.
  // Scene list (screen 14)
  'Watch, listen and practice real conversations.': '看视频、听一听，练习真实的对话。',
  '{scene} Conversations': '{scene}的对话',
  '{count} conversations in this scene.': '这里有{count}个对话。',
  'Conversation {number}: {title}': '第{number}个对话：{title}',
  'Conversation {number}: {title} (completed)': '第{number}个对话：{title}（已完成）',
  // Video (screen 10) and the player
  '{title} · Video': '{title} · 视频',
  'Conversation {number} of {total}': '第{number}个对话，共{total}个',
  'Nice watching! Now read the conversation.': '看得真棒！现在来读一读对话吧。',
  'View Conversation': '查看对话',
  'Video: {title}': '视频：{title}',
  'This video can’t play right now': '这个视频现在播放不了',
  'Video coming soon': '视频即将推出',
  'You can still read and listen to the conversation.': '你还是可以读一读、听一听这段对话。',
  Seek: '播放进度',
  '{time} of {duration}': '已播放{time}，共{duration}',
  Play: '播放',
  Pause: '暂停',
  'Playback speed {rate}x': '播放速度：{rate}倍',
  HD: '高清',
  // Detail (screen 15) and transcript (screen 11)
  'Lesson complete! You practiced every question in “{title}”.':
    '这一课完成啦！“{title}”里的每一道题你都练习过了。',
  'Watch the video': '看视频',
  Completed: '已完成',
  'Listen to the whole conversation': '听一听整段对话',
  Transcript: '对话文本',
  'Practice Speaking': '练习口语',
  '{title} · Transcript': '{title} · 对话文本',
  '{title} — transcript': '{title}——对话文本',
  '{speaker}:': '{speaker}：',
  ', line {number}': '，第{number}句',
  'Play: {line}': '播放：{line}',
  Translate: '翻译',
  Hide: '隐藏',
  // Speaking practice (screen 12) and result (screen 13)
  Practice: '练习',
  '{title} · Speaking': '{title} · 口语',
  '{title} · Result': '{title} · 结果',
  'Speaking Practice': '口语练习',
  'Speaking Result': '口语练习结果',
  'Question {number} of {total}': '第{number}题，共{total}题',
  'Listen to the question': '听一听问题',
  'Tap to speak': '点一下，开始说话',
  'Tap to speak again': '点一下，再说一次',
  'Please allow the microphone…': '请允许使用麦克风……',
  'Listening… tap to stop': '正在听……点一下停止',
  'Checking what you said…': '正在检查你说的话……',
  'Stop listening': '停止聆听',
  'Listen & Repeat': '跟着读',
  'Example Answer': '参考答案',
  'Listen to the example answer': '听一听参考答案',
  'Your Answer': '你的回答',
  'You said the example answer out loud.': '你大声说出了参考答案。',
  'Listen to what we heard': '听一听我们听到的话',
  'Tap the microphone and say your answer.': '点麦克风，说出你的回答。',
  'Tap the speaker next to “Example Answer” and listen.': '点一下“参考答案”旁边的小喇叭，听一听。',
  'Say the sentence out loud, slowly and clearly.': '大声说出这句话，说得慢一点、清楚一点。',
  'When you are ready, tap “Mark as Practiced”.': '准备好了，就点“我练习过了”。',
  'Mark as Practiced': '我练习过了',
  'Use the microphone': '使用麦克风',
  'Can’t use the microphone? Listen & Repeat instead': '不能用麦克风？那就跟着读吧',
  'This browser can’t listen to your voice, so let’s practice by listening and repeating.':
    '这个浏览器听不到你的声音，我们来跟着读吧。',
  'We check the words we heard — not your pronunciation. Nothing is recorded or saved.':
    '我们只检查听到的字词，不给发音打分。不会录音，也不会保存。',
  'No speaking questions yet': '还没有口语练习题',
  'You can still mark this conversation as done.': '你还是可以把这个对话标记为完成。',
  'Mark as Completed': '标记为完成',
  'Next Question': '下一题',
  'Finish Lesson': '完成这一课',
  // Word-match feedback (spec §9.4)
  'Great job! That sounds just like the example.': '太棒了！听起来和参考答案一模一样。',
  'Good! Very close to the example.': '很好！和参考答案很接近了。',
  'Let’s try again! Listen to the example, then say it slowly.':
    '再试一次吧！先听一听参考答案，再慢慢地说。',
  'Well done for practicing!': '你认真练习了，真棒！',
  // Microphone problems (spec §9.4)
  'We didn’t hear anything. Tap the microphone and try again!':
    '我们什么也没听到。点麦克风，再试一次！',
  'The microphone is blocked, so let’s practice by listening and repeating.':
    '麦克风被禁用了，我们来跟着读吧。',
  'No microphone was found, so let’s practice by listening and repeating.':
    '没有找到麦克风，我们来跟着读吧。',
  'Speech recognition isn’t available right now. Let’s listen and repeat instead.':
    '现在用不了语音识别，我们来跟着读吧。',
  'Something went wrong with the microphone. Let’s listen and repeat instead.':
    '麦克风出了点问题，我们来跟着读吧。',
};
