/** API 模式只在适配层判断，页面和 Store 不读取环境变量。 */
export const isRealApi = import.meta.env.VITE_API_MODE === 'real'
