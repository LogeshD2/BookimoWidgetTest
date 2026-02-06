import { useState } from 'react'
import { AppointmentDialog } from './AppointmentDialog'
import { Button } from './components/ui/button'
import "./index.css";

function App() {
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Button onClick={() => setOpen(true)}>
        Ouvrir le formulaire
      </Button>
      <AppointmentDialog open={open} onOpenChange={setOpen} />
    </div>
  )
}

export default App