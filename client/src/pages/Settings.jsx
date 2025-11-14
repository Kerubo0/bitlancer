import { useState } from 'react'
import Layout from '../components/Layout'
import Card from '../components/Card'
import Input from '../components/Input'
import Button from '../components/Button'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Settings() {
  const { user, walletInfo } = useAuth()
  const [profileData, setProfileData] = useState({
    fullName: user?.user_metadata?.full_name || '',
    email: user?.email || '',
  })

  const handleProfileUpdate = (e) => {
    e.preventDefault()
    toast.success('Profile updated successfully!')
  }

  return (
    <Layout>
      <div className="p-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account settings</p>
        </div>

        {/* Profile Settings */}
        <Card className="mb-6">
          <h2 className="text-xl font-semibold text-primary mb-6">Profile Information</h2>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <Input
              label="Full Name"
              value={profileData.fullName}
              onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              value={profileData.email}
              disabled
            />
            <Button type="submit">Update Profile</Button>
          </form>
        </Card>

        {/* Wallet Information */}
        <Card className="mb-6">
          <h2 className="text-xl font-semibold text-primary mb-6">Wallet Information</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Wallet ID</label>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-900 font-mono text-sm break-all">
                  {walletInfo?.wallet_id || 'Not available'}
                </p>
              </div>
            </div>
            <div>
              <label className="label">On-chain Address</label>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-900 font-mono text-sm break-all">
                  {walletInfo?.onchain_address || 'Not available'}
                </p>
              </div>
            </div>
            <div>
              <label className="label">Lightning Address</label>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-900 font-mono text-sm break-all">
                  {walletInfo?.lightning_address || 'Not available'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Security Settings */}
        <Card className="mb-6">
          <h2 className="text-xl font-semibold text-primary mb-6">Security</h2>
          <div className="space-y-4">
            <Button variant="secondary">Change Password</Button>
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600 mb-3">Two-factor authentication adds an extra layer of security</p>
              <Button variant="secondary">Enable 2FA</Button>
            </div>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card>
          <h2 className="text-xl font-semibold text-red-600 mb-6">Danger Zone</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-3">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <Button variant="danger">Delete Account</Button>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  )
}
