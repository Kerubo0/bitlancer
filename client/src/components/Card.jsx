import { motion } from 'framer-motion'

export default function Card({ children, className = '', hover = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card ${hover ? 'hover:shadow-lg cursor-pointer' : ''} ${className}`}
    >
      {children}
    </motion.div>
  )
}
