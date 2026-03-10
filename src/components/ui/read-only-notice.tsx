import { Info } from "lucide-react"

export const ReadOnlyNotice = ({
    message = "You have read-only access to this section."
}: { message?: string }) => (
    <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm mb-4">
        <Info className="h-4 w-4 shrink-0" />
        <span>{message}</span>
    </div>
)
