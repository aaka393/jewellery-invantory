import React, { useState, useEffect } from 'react';
import { Plus, MapPin } from 'lucide-react';
import { useAddressStore } from '../../store/addressStore';
import { useAuthStore } from '../../store/authStore';
import { Address } from '../../types/address';
import AddressCard from './AddressCard';
import AddressForm from './AddressForm';
import ConfirmDialog from '../common/ConfirmDialog';

interface AddressSelectorProps {
  onAddressSelect?: (address: Address) => void;
  selectedAddressId?: string;
  showTitle?: boolean;
}

const AddressSelector: React.FC<AddressSelectorProps> = ({
  onAddressSelect,
  selectedAddressId,
  showTitle = true
}) => {
  const { isAuthenticated } = useAuthStore();
  const {
    addresses,
    selectedAddress,
    loading,
    addAddress,
    updateAddress,
    deleteAddress,
    setSelectedAddress,
    setDefaultAddress,
    loadAddresses
  } = useAddressStore();

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    address: Address | null;
  }>({ isOpen: false, address: null });

  useEffect(() => {
    if (isAuthenticated) {
      console.log('User authenticated, loading user-specific addresses...');
      loadAddresses();
    } else {
      console.log('User not authenticated, clearing addresses');
      // Clear addresses when user logs out
      const { clearAddresses } = useAddressStore.getState();
      clearAddresses();
    }
  }, [isAuthenticated, loadAddresses]);

  // Set selected address based on prop
  useEffect(() => {
    if (selectedAddressId) {
      const address = addresses.find(addr => addr.id === selectedAddressId);
      if (address) {
        setSelectedAddress(address);
      }
    }
  }, [selectedAddressId, addresses, setSelectedAddress]);

  const handleAddressSelect = (address: Address) => {
    setSelectedAddress(address);
    onAddressSelect?.(address);
  };

  const handleAddAddress = async (addressData: any) => {
    try {
      await addAddress(addressData);
      setShowAddressForm(false);
    } catch (error) {
      console.error('Error adding address:', error);
      // Error will be shown in the form component
    }
  };

  const handleEditAddress = async (addressData: any) => {
    if (editingAddress) {
      try {
        await updateAddress(editingAddress.id, addressData);
        setEditingAddress(null);
        setShowAddressForm(false);
      } catch (error) {
        console.error('Error updating address:', error);
        // Error will be shown in the form component
      }
    }
  };

  const handleDeleteAddress = async () => {
    if (deleteDialog.address) {
      try {
        await deleteAddress(deleteDialog.address.id);
        setDeleteDialog({ isOpen: false, address: null });
      } catch (error) {
        console.error('Error deleting address:', error);
        alert('Failed to delete address. Please try again.');
      }
    }
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      await setDefaultAddress(addressId);
    } catch (error) {
      console.error('Error setting default address:', error);
      alert('Failed to set default address. Please try again.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-8">
        <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Please Login</h3>
        <p className="text-gray-600">You need to be logged in to manage addresses.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showTitle && (
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ✨ Where should we deliver your jewelry?
          </h2>
          <p className="text-gray-600">
            To ensure safe and timely delivery of your precious order, please choose a saved address or add a new one.
          </p>
        </div>
      )}

      {/* Saved Addresses */}
      {addresses.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            📍 Saved Addresses
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Select one of your saved delivery addresses below. You can edit or remove any address, or add a new one if needed.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((address) => (
              <AddressCard
                key={address.id}
                address={address}
                isSelected={selectedAddress?.id === address.id}
                onSelect={() => handleAddressSelect(address)}
                onEdit={() => {
                  setEditingAddress(address);
                  setShowAddressForm(true);
                }}
                onDelete={() => setDeleteDialog({ isOpen: true, address })}
                onSetDefault={() => handleSetDefault(address.id)}
                showSelectButton={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Add New Address */}
      <div className="text-center">
        {addresses.length === 0 ? (
          <div className="py-8">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No addresses found</h3>
            <p className="text-gray-600 mb-6">
              Don't see your delivery location? Add a new address to continue.
            </p>
          </div>
        ) : (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ➕ Add a New Address
            </h3>
            <p className="text-gray-600 mb-4">
              Don't see your delivery location? Add a new address to continue.
            </p>
          </div>
        )}

        <button
          onClick={() => {
            setEditingAddress(null);
            setShowAddressForm(true);
          }}
          className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center space-x-2 mx-auto"
        >
          <Plus className="h-5 w-5" />
          <span>+ Add New Address</span>
        </button>
      </div>

      {/* Selected Address Summary */}
      {selectedAddress && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            🚚 Great! We're delivering to this address:
          </h3>
          <div className="text-sm text-green-700">
            <p className="font-medium">{selectedAddress.fullName}</p>
            <p>{selectedAddress.houseNumber}, {selectedAddress.streetArea}</p>
            {selectedAddress.landmark && <p>Landmark: {selectedAddress.landmark}</p>}
            <p>{selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}</p>
            <p>Mobile: {selectedAddress.mobileNumber}</p>
          </div>
        </div>
      )}

      {/* Address Form Dialog */}
      <AddressForm
        isOpen={showAddressForm}
        onClose={() => {
          setShowAddressForm(false);
          setEditingAddress(null);
        }}
        onSave={editingAddress ? handleEditAddress : handleAddAddress}
        address={editingAddress}
        loading={loading}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, address: null })}
        onConfirm={handleDeleteAddress}
        title="Delete Address"
        message={`Are you sure you want to delete this address for ${deleteDialog.address?.fullName}?`}
        confirmText="Delete"
        type="danger"
        loading={loading}
      />
    </div>
  );
};

export default AddressSelector;