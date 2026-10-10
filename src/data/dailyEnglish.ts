// 每日一句：英文名句池 + 按「一年中的第几天」取句。
// 取句规则：dayOfYear % 长度，保证同一天刷新页面拿到的是同一句；
// 用户点「换一句」时在当日基准上做偏移，刷新后回到当日句子。

export interface DailySentence {
  en: string
  zh: string
  from?: string
}

export const SENTENCES: DailySentence[] = [
  { en: 'The best way to predict the future is to invent it.', zh: '预测未来最好的方式，就是把它创造出来。', from: 'Alan Kay' },
  { en: 'Simplicity is the ultimate sophistication.', zh: '简单，是极致的复杂。', from: 'Leonardo da Vinci' },
  { en: 'Talk is cheap. Show me the code.', zh: '废话少说，放码过来。', from: 'Linus Torvalds' },
  { en: 'Premature optimization is the root of all evil.', zh: '过早优化是万恶之源。', from: 'Donald Knuth' },
  { en: 'Programs must be written for people to read.', zh: '程序首先是写给人读的，顺便让机器执行。', from: 'Harold Abelson' },
  { en: 'Make it work, make it right, make it fast.', zh: '先让它跑起来，再让它正确，最后让它快。', from: 'Kent Beck' },
  { en: 'Any fool can write code that a computer understands.', zh: '写出机器能懂的代码不难，难的是写出人能懂的代码。', from: 'Martin Fowler' },
  { en: 'The only way to learn a new language is to write it.', zh: '学会一门语言的唯一方法，就是动手去写。' },
  { en: 'Stay hungry, stay foolish.', zh: '求知若饥，虚心若愚。', from: 'Steve Jobs' },
  { en: 'Done is better than perfect.', zh: '完成，胜过完美。', from: 'Sheryl Sandberg' },
  { en: 'Move fast and break things — then fix them well.', zh: '快速前进，允许打破，但要修得漂亮。' },
  { en: 'Good design is as little design as possible.', zh: '好的设计，是尽可能少的设计。', from: 'Dieter Rams' },
  { en: 'Constraints are not the enemy of creativity.', zh: '限制不是创造力的敌人，而是它的骨架。' },
  { en: ' discipline is choosing what you want most.', zh: '自律，是选择你最想要的东西。' },
  { en: 'You do not rise to the level of your goals.', zh: '你不会升到目标的高度，只会落到系统的水平。', from: 'James Clear' },
  { en: 'Small progress is still progress.', zh: '微小的进步，也是进步。' },
  { en: 'The computer was born to solve problems.', zh: '计算机生来就是为了解决问题。', from: 'Edsger Dijkstra' },
  { en: 'It works on my machine is not a test strategy.', zh: '「我机器上能跑」不是一种测试策略。' },
  { en: 'Write code as if the next maintainer is violent.', zh: '写代码时，假设下一个接手的人有暴力倾向。' },
  { en: 'Debugging is twice as hard as writing the code.', zh: '调试的难度是写代码的两倍。', from: 'Brian Kernighan' },
  { en: 'There are only two hard things in computer science.', zh: '计算机科学里只有两件难事：缓存失效和命名。', from: 'Phil Karlton' },
  { en: 'First, solve the problem. Then, write the code.', zh: '先解决问题，再写代码。', from: 'John Johnson' },
  { en: 'Experience is the name everyone gives to their mistakes.', zh: '经验，不过是人们给自己的错误取的名字。', from: 'Oscar Wilde' },
  { en: 'Perfection is achieved when there is nothing left to take away.', zh: '当没有什么可以再被拿掉时，完美就达成了。', from: 'Antoine de Saint-Exupéry' },
  { en: 'The details are not the details. They make the design.', zh: '细节不是细节，细节构成了设计本身。', from: 'Charles Eames' },
  { en: 'Learning never exhausts the mind.', zh: '学习永远不会被耗尽。', from: 'Leonardo da Vinci' },
  { en: 'What I cannot create, I do not understand.', zh: '我无法创造的东西，我就还没有真正理解。', from: 'Richard Feynman' },
  { en: 'Consistency is what transforms average into excellence.', zh: '是把平庸变成卓越的，是一致性。' },
  { en: 'Anything worth doing is worth doing slowly at first.', zh: '任何值得做的事，一开始都值得慢慢做。' },
  { en: 'The secret of getting ahead is getting started.', zh: '取得进展的秘诀，就是开始。', from: 'Mark Twain' },
  { en: 'Code is like humor. When you have to explain it, it is bad.', zh: '代码就像幽默：需要解释的时候，就已经不好笑了。' },
  { en: 'Weeks of coding can save you hours of planning.', zh: '几周的编码，能省下你几小时的规划——反过来说。' },
  { en: 'Simplicity is prerequisite for reliability.', zh: '简单，是可靠的前提。', from: 'Edsger Dijkstra' },
  { en: 'To iterate is human, to recurse divine.', zh: '迭代是人的本能，递归是神的领域。' },
  { en: 'Knowledge shared is knowledge squared.', zh: '分享出去的知识，会变成知识的平方。' },
  { en: 'Build things. Break things. Learn. Repeat.', zh: '造点东西，弄坏它，学到东西，然后重来。' }
]

/** 一年中的第几天（1 起算） */
function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0)
  return Math.floor((date.getTime() - start.getTime()) / 86400000)
}

/** 取指定日期的句子：同一天始终返回同一句 */
export function getDailySentence(date: Date = new Date(), offset = 0): DailySentence {
  const index = (dayOfYear(date) - 1 + offset) % SENTENCES.length
  return SENTENCES[(index + SENTENCES.length) % SENTENCES.length]
}

/** 星期缩写，用于日期戳 */
export function weekdayShort(date: Date): string {
  return ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][date.getDay()]
}
