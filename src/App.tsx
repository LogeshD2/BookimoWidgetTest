import { useState } from 'react'
import { AppointmentDialog } from './AppointmentDialog'
import { Button } from './components/ui/button'
import "./index.css";

function App() {
  const [open, setOpen] = useState(false)

  console.log('App rendered, open =', open); // ✅ Debug

  return (
    <div className="appointment-widget-root min-h-screen flex items-center justify-center bg-gray-100">
      <Button onClick={() => {
        console.log('Button clicked!'); // ✅ Debug
        setOpen(true);
        console.log('setOpen(true) called'); // ✅ Debug
      }}>
        Ouvrir le formulaire
      </Button>
      <AppointmentDialog open={open} onOpenChange={setOpen} />
    </div>
  )
}

export default App