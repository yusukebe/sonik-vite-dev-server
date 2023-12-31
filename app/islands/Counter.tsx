import { useSignal } from '@preact/signals'

export default function Counter() {
  const count = useSignal(3)
  const increment = () => {
    count.value++
  }
  return (
    <div>
      <p>Counter: {count}</p>
      <button onClick={increment}>Increment</button>
    </div>
  )
}
