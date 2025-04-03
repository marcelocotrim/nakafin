import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoginForm } from "./_components/login-form"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900">NakaFin</h1>
        <p className="text-sm text-gray-600 mt-2">Gerencie seus eventos corporativos</p>
      </div>
      <div className="w-full px-4 flex justify-center">
        <Card className="mt-8 w-[400px]">
          <CardHeader>
            <CardTitle>Entrar</CardTitle>
            <CardDescription>
              Digite suas credenciais para acessar sua conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
