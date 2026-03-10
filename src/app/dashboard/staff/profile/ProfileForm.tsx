"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { CheckCircle2, XCircle } from "lucide-react"
import { updateStaffProfile, updateStaffPassword } from "@/app/actions/staff"

type ProfileFormProps = {
    userId: number
    firstName: string | null
    lastName: string | null
    email: string
}

type PasswordFormValues = {
    currentPassword: string
    newPassword: string
    confirmPassword: string
}

export function ProfileForm({ firstName, lastName, email }: ProfileFormProps) {
    const [saving, setSaving] = useState(false)
    const [changingPassword, setChangingPassword] = useState(false)

    // ── Personal info form ──
    const {
        register: regProfile,
        handleSubmit: handleProfile,
        formState: { errors: profileErrors },
    } = useForm({
        defaultValues: { firstName: firstName || "", lastName: lastName || "", email },
    })

    const onSaveProfile = handleProfile(async (data) => {
        setSaving(true)
        const result = await updateStaffProfile(data)
        setSaving(false)
        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success("Profile updated successfully")
        }
    })

    // ── Password form ──
    const {
        register: regPwd,
        handleSubmit: handlePwd,
        watch,
        reset: resetPwd,
        formState: { errors: pwdErrors },
    } = useForm<PasswordFormValues>({
        defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
    })

    const newPassword = watch("newPassword", "")
    const confirmPassword = watch("confirmPassword", "")
    const passwordLongEnough = newPassword.length >= 8
    const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword

    const onChangePassword = handlePwd(async (data) => {
        if (!passwordsMatch) {
            toast.error("Passwords do not match")
            return
        }
        setChangingPassword(true)
        const result = await updateStaffPassword(data)
        setChangingPassword(false)
        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success("Password updated successfully")
            resetPwd()
        }
    })

    return (
        <div className="space-y-6">
            {/* Personal Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Personal Information</CardTitle>
                    <CardDescription>Update your name and email address.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={onSaveProfile} className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="firstName">First Name</Label>
                                <Input
                                    id="firstName"
                                    {...regProfile("firstName", { required: "First name is required" })}
                                />
                                {profileErrors.firstName && (
                                    <p className="text-xs text-red-500">{profileErrors.firstName.message}</p>
                                )}
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input
                                    id="lastName"
                                    {...regProfile("lastName", { required: "Last name is required" })}
                                />
                                {profileErrors.lastName && (
                                    <p className="text-xs text-red-500">{profileErrors.lastName.message}</p>
                                )}
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                {...regProfile("email", {
                                    required: "Email is required",
                                    pattern: { value: /^\S+@\S+\.\S+$/, message: "Invalid email format" },
                                })}
                            />
                            {profileErrors.email && (
                                <p className="text-xs text-red-500">{profileErrors.email.message}</p>
                            )}
                        </div>
                        <Button type="submit" disabled={saving}>
                            {saving ? "Saving…" : "Save Changes"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Change Password */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Change Password</CardTitle>
                    <CardDescription>Update your login password.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={onChangePassword} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="currentPassword">Current Password</Label>
                            <Input
                                id="currentPassword"
                                type="password"
                                {...regPwd("currentPassword", { required: "Current password is required" })}
                            />
                            {pwdErrors.currentPassword && (
                                <p className="text-xs text-red-500">{pwdErrors.currentPassword.message}</p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                                id="newPassword"
                                type="password"
                                {...regPwd("newPassword", {
                                    required: "New password is required",
                                    minLength: { value: 8, message: "Must be at least 8 characters" },
                                })}
                            />
                            {pwdErrors.newPassword && (
                                <p className="text-xs text-red-500">{pwdErrors.newPassword.message}</p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                {...regPwd("confirmPassword", { required: "Please confirm your password" })}
                            />
                            {pwdErrors.confirmPassword && (
                                <p className="text-xs text-red-500">{pwdErrors.confirmPassword.message}</p>
                            )}
                        </div>

                        {/* Password rules */}
                        <div className="space-y-1 text-sm">
                            <div className={`flex items-center gap-2 ${passwordLongEnough ? "text-green-600" : "text-muted-foreground"}`}>
                                {passwordLongEnough ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                                At least 8 characters
                            </div>
                            <div className={`flex items-center gap-2 ${passwordsMatch ? "text-green-600" : "text-muted-foreground"}`}>
                                {passwordsMatch ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                                Passwords match
                            </div>
                        </div>

                        <Button type="submit" disabled={changingPassword} variant="outline">
                            {changingPassword ? "Updating…" : "Update Password"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
