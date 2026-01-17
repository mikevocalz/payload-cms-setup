export const formatDateTime = (timestamp: string): string => {
  const date = new Date(timestamp)
  
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  
  const month = months[date.getMonth()]
  const day = date.getDate()
  const year = date.getFullYear()
  
  return `${month} ${day}, ${year}`
}
