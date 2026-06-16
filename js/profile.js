/**
 * Lohar Auto Garage — User Profile & Address Manager
 * Handles user address list CRUD, and personal details updates
 */

// Load profile data
window.loadProfile = async () => {
  if (!isLoggedIn()) {
    window.location.href = '/pages/auth.html?redirect=/pages/profile.html';
    return;
  }

  const loader = document.getElementById('profileLoader');
  const content = document.getElementById('profileContent');
  if (loader) loader.style.display = 'block';

  try {
    const res = await AuthAPI.me();
    const user = res.user;
    saveUser(user); // Sync info locally

    if (loader) loader.style.display = 'none';
    if (content) content.style.display = 'block';

    // Populate Fields
    document.getElementById('profileNameInput').value = user.name || '';
    document.getElementById('profileEmailInput').value = user.email || '';
    document.getElementById('profilePhoneInput').value = user.phone || '';

    renderAddresses(user.addresses || []);

  } catch (err) {
    if (loader) loader.style.display = 'none';
    clearToken();
    clearUser();
    window.location.href = '/pages/auth.html?redirect=/pages/profile.html';
  }
};

// Render user addresses
const renderAddresses = (addresses) => {
  const container = document.getElementById('profileAddressesList');
  if (!container) return;

  if (addresses.length === 0) {
    container.innerHTML = `<p style="font-size:0.85rem; color:rgba(255,255,255,0.4)">No saved shipping addresses found.</p>`;
    return;
  }

  container.innerHTML = addresses.map(addr => `
    <div class="glass-card address-profile-card" style="padding:15px; margin-bottom:12px; border:1px solid rgba(255,255,255,0.06); border-radius:10px; display:flex; justify-content:space-between; align-items:center;">
      <div>
        <div style="display:flex; gap:8px; align-items:center; margin-bottom:4px">
          <strong style="color:#fff; font-size:0.9rem">${addr.label}</strong>
          ${addr.isDefault ? `<span style="font-size:0.7rem; background:#f5c518; color:#000; padding:1px 6px; border-radius:3px; font-weight:700">Default</span>` : ''}
        </div>
        <p style="font-size:0.8rem; color:rgba(255,255,255,0.6); line-height:1.4">${addr.fullName} (${addr.phone})<br>${addr.line1}, ${addr.line2 || ''}<br>${addr.city}, ${addr.state} - ${addr.pincode}</p>
      </div>
      <button onclick="deleteAddress('${addr._id}')" style="background:none; border:none; color:#ef4444; font-size:1.5rem; cursor:pointer; padding:6px; line-height:1; display:flex; align-items:center; justify-content:center;" title="Delete Address">×</button>
    </div>
  `).join('');
};

// Handle profile update
window.updateProfileDetails = async (e) => {
  e.preventDefault();
  
  const btn = document.getElementById('saveProfileBtn');
  btn.disabled = true;
  btn.textContent = 'Saving...';

  try {
    const name = document.getElementById('profileNameInput').value.trim();
    const phone = document.getElementById('profilePhoneInput').value.trim();

    const res = await AuthAPI.updateProfile({ name, phone });
    saveUser(res.user);
    toast.success('Profile details updated successfully!');
    
    // Refresh header
    if (window.updateAuthNav) updateAuthNav();
  } catch (err) {
    toast.error(err.message || 'Failed to update profile');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save Changes';
  }
};

// Add new address
window.addNewProfileAddress = async (e) => {
  e.preventDefault();
  
  const btn = document.getElementById('addAddressBtn');
  btn.disabled = true;
  btn.textContent = 'Adding Address...';

  try {
    const label = document.getElementById('addrLabel').value.trim() || 'Home';
    const fullName = document.getElementById('addrName').value.trim();
    const phone = document.getElementById('addrPhone').value.trim();
    const line1 = document.getElementById('addrLine1').value.trim();
    const line2 = document.getElementById('addrLine2').value.trim();
    const city = document.getElementById('addrCity').value.trim();
    const state = document.getElementById('addrState').value.trim();
    const pincode = document.getElementById('addrPincode').value.trim();
    const isDefault = document.getElementById('addrDefault').checked;

    if (!fullName || !phone || !line1 || !city || !state || !pincode) {
      toast.warning('Please fill in all required address fields');
      btn.disabled = false;
      btn.textContent = 'Add Address';
      return;
    }

    const res = await AuthAPI.addAddress({
      label, fullName, phone, line1, line2, city, state, pincode, isDefault
    });

    toast.success('Shipping address added!');
    document.getElementById('addressForm').reset();
    
    // Refresh user object and UI
    saveUser(res.user);
    renderAddresses(res.user.addresses || []);

  } catch (err) {
    toast.error(err.message || 'Failed to add address');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Add Address';
  }
};

// Delete address
window.deleteAddress = async (id) => {
  if (!confirm('Are you sure you want to remove this address?')) return;

  try {
    const res = await AuthAPI.deleteAddress(id);
    toast.info('Address removed');
    
    saveUser(res.user);
    renderAddresses(res.user.addresses || []);
  } catch (err) {
    toast.error('Failed to delete address');
  }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('profileLoader')) {
    loadProfile();
  }
});
