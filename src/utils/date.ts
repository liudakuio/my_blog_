// 日期 / 时间工具：统一全项目散落的日期取值与格式化写法。
// 背景：此前项目里同时存在三种写法——手写 padStart 拼日期戳、new Date().getFullYear()、
//   以及唯一的 dayjs().format(...) 调用；现统一基于已有依赖 dayjs 实现，输出格式保持不变。
// 被谁引用：src/components/DailyEnglish.vue（日期戳）、src/layout/index.vue（页脚年份）、
//   src/views/admin/dashboard/index.vue（欢迎横幅日期）。
import dayjs from 'dayjs'

/** 星期缩写表，索引与 Date.getDay() 对齐（周日为 0） */
const WEEKDAY_SHORT = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

/**
 * 星期缩写（如 SAT），用于日期戳展示。
 * @param date 目标日期，默认今天
 */
export function weekdayShort(date: Date = new Date()): string {
  return WEEKDAY_SHORT[date.getDay()]
}

/**
 * 今日日期戳，格式「2026.10.10 · SAT」。
 * @param date 目标日期，默认今天
 */
export function todayStamp(date: Date = new Date()): string {
  return `${dayjs(date).format('YYYY.MM.DD')} · ${weekdayShort(date)}`
}

/**
 * 当前年份（页脚版权年份）。
 */
export function currentYear(): number {
  return dayjs().year()
}

/**
 * 按 dayjs 格式模板格式化日期。
 * @param date 目标日期，默认今天
 * @param template dayjs 格式模板，如 'YYYY 年 MM 月 DD 日 dddd'
 */
export function formatDate(date: Date = new Date(), template = 'YYYY-MM-DD'): string {
  return dayjs(date).format(template)
}
