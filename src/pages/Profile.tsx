import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Star, Package, IndianRupee, LogOut, Edit } from "lucide-react";
import { toast } from "sonner";

const Profile = () => {
  const { user, profile, logout, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [hostel, setHostel] = useState(profile?.hostel || "");
  const [college, setCollege] = useState(profile?.college || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [upiId, setUpiId] = useState(profile?.upiId || "");
  const [bankingName, setBankingName] = useState(profile?.bankingName || "");

  const handleSave = async () => {
    await updateUserProfile({ hostel, college, phone, upiId, bankingName });
    setEditing(false);
    toast.success("Profile updated!");
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  if (!profile) return <Layout><div className="flex items-center justify-center h-screen text-muted-foreground">Loading...</div></Layout>;

  return (
    <Layout>
      <div className="px-4 pt-6 pb-4">
        {/* Header card */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-card mb-6 text-center">
          <div className="w-20 h-20 rounded-full gradient-primary mx-auto flex items-center justify-center mb-3">
            <span className="text-3xl font-heading font-bold text-primary-foreground">
              {profile.displayName.charAt(0).toUpperCase()}
            </span>
          </div>
          <h2 className="font-heading text-xl font-bold text-foreground">{profile.displayName}</h2>
          <p className="text-sm text-muted-foreground">{profile.email}</p>
          {profile.rating > 0 && (
            <div className="flex items-center justify-center gap-1 mt-2">
              <Star className="h-4 w-4 text-secondary fill-secondary" />
              <span className="font-semibold text-foreground">{profile.rating}</span>
              <span className="text-xs text-muted-foreground">({profile.total_ratings} ratings)</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-card rounded-xl border border-border p-4 shadow-card text-center">
            <Package className="h-6 w-6 text-primary mx-auto mb-1" />
            <p className="text-2xl font-heading font-bold text-foreground">{profile.total_deliveries}</p>
            <p className="text-xs text-muted-foreground">Deliveries</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 shadow-card text-center">
            <IndianRupee className="h-6 w-6 text-secondary mx-auto mb-1" />
            <p className="text-2xl font-heading font-bold text-foreground">₹{profile.total_earnings}</p>
            <p className="text-xs text-muted-foreground">Earned</p>
          </div>
        </div>

        {/* Editable fields */}
        <div className="bg-card rounded-xl border border-border p-4 shadow-card mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-semibold text-foreground">Details</h3>
            <Button variant="ghost" size="sm" onClick={() => setEditing(!editing)}>
              <Edit className="h-4 w-4 mr-1" /> {editing ? "Cancel" : "Edit"}
            </Button>
          </div>
          {editing ? (
            <div className="space-y-3">
              <div><Label>College</Label><Input value={college} onChange={(e) => setCollege(e.target.value)} placeholder="Your college name" /></div>
              <div><Label>Hostel / Room</Label><Input value={hostel} onChange={(e) => setHostel(e.target.value)} placeholder="Hostel 5, Room 302" /></div>
              <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210" /></div>
              <div><Label>UPI ID</Label><Input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="yourname@upi" /></div>
              <div><Label>Banking Name (as on UPI)</Label><Input value={bankingName} onChange={(e) => setBankingName(e.target.value)} placeholder="Full name as registered on UPI" /></div>
              <Button onClick={handleSave} className="w-full gradient-primary text-primary-foreground font-semibold">Save</Button>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">College</span><span className="text-foreground">{profile.college || "Not set"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Hostel</span><span className="text-foreground">{profile.hostel || "Not set"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="text-foreground">{profile.phone || "Not set"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">UPI ID</span><span className="text-foreground">{profile.upiId || "Not set"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Banking Name</span><span className="text-foreground">{profile.bankingName || "Not set"}</span></div>
            </div>
          )}
        </div>

        <Button variant="outline" onClick={handleLogout} className="w-full text-destructive">
          <LogOut className="h-4 w-4 mr-1" /> Sign Out
        </Button>
      </div>
    </Layout>
  );
};

export default Profile;
