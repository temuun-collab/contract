import { ContractProvider } from "@/lib/contract-context"
import { Dashboard } from "@/components/dashboard"

export default function Home() {
  return (
    <ContractProvider>
      <Dashboard />
    </ContractProvider>
  )
}
