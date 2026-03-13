import Logout from '@/components/auth/Logout'
import { Button } from '@/components/ui/button'
import api from '@/lib/axios'
import { useAuthStore } from '@/stores/useAuthStore'

import { toast } from 'sonner'

const ChatAppPage = () => {
  const user = useAuthStore((s) => s.user)

  const handleOnclick = async() =>{
    try {
      await api.get("/users/test", {withCredentials: true})
      toast.success("ok")

    } catch (error) {
      toast.error("that bai")
      console.error("error")
    }
  }
  return (
    <div>
      {user?.username}
      <Logout/>

      <Button onClick={handleOnclick}>test</Button>
    </div>
  )
}

export default ChatAppPage