import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import Avatar from "../../components/ui/avatar/Avatar";
import { Modal } from "../../components/ui/modal";

import api from "../../services/api";
import { format } from "date-fns";
import AlarmForm from "../../components/alarms/AlarmForm";
import SmallMap from "../../components/alarms/maps/SmallMap";
import MapViewerModal from "../../components/alarms/maps/MapViewerModal";

interface Tenant {
  id: number;
  name: string;
  phone: string;
}

interface AlarmImage {
  id: number;
  image: string;
  image_url: string;
  uploaded_at: string;
  description: string;
}

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

interface AlarmUpdate {
  id: number;
  update_type: 'call_attempt' | 'customer_contact' | 'status_change' | 'general_note';
  note: string;
  created_by: number;  // This is just the ID now
  created_at: string;
}

interface Alarm {
  id: number;
  date: string;
  is_rental: boolean;
  is_private: boolean;
  realestate_name: string | null;
  street_number: string | null;
  street_name: string | null;
  suburb: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  who_contacted: string;
  contact_method: 'email' | 'phone' | 'work_order';
  work_order_number: string;
  sound_type: 'full_alarm' | 'chirping_alarm';
  install_date: string | null;
  brand: 'red' | 'firepro' | 'emerald' | 'cavius' | 'other';
  hardwire_alarm: number | null;
  wireless_alarm: number | null;
  is_wall_control: boolean;
  completed: boolean;
  stage: 'to_be_booked' | 'quote_sent' | 'completed' | 'to_be_called';
  tenants: Tenant[];
  created_at: string;
  updated_at: string;
  images?: AlarmImage[];
}

interface ImageModalState {
  images: AlarmImage[];
  currentIndex: number;
}

export default function AlarmDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [alarm, setAlarm] = useState<Alarm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMapViewerOpen, setIsMapViewerOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isGalleryUploadModalOpen, setIsGalleryUploadModalOpen] = useState(false);
  const [updates, setUpdates] = useState<AlarmUpdate[]>([]);
  const [users, setUsers] = useState<{ [key: number]: User }>({});
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [updatesLoading, setUpdatesLoading] = useState(true);
  const [updateType, setUpdateType] = useState<AlarmUpdate['update_type']>('general_note');
  const [updateNote, setUpdateNote] = useState('');
  const [isSubmittingUpdate, setIsSubmittingUpdate] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [modalState, setModalState] = useState<ImageModalState | null>(null);
  const [selectedUpdateId, setSelectedUpdateId] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSubmittingStageChange, setIsSubmittingStageChange] = useState(false);
  const [isStageDropdownOpen, setIsStageDropdownOpen] = useState(false);

  const fetchAlarmDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/alarms/${id}/`);
      console.log('Alarm details response:', response.data);
      console.log('Images in response:', response.data.images);
      setAlarm(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch alarm details');
      console.error('Error fetching alarm details:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userId: number) => {
    try {
      const response = await api.get(`/api/users/${userId}/`);
      console.log('User details response:', response.data);
      setUsers(prev => ({
        ...prev,
        [userId]: response.data as User
      }));
    } catch (err) {
      console.error('Error fetching user details:', err);
      // Store a placeholder user object on error
      setUsers(prev => ({
        ...prev,
        [userId]: {
          id: userId,
          first_name: '',
          last_name: '',
          email: `User ${userId}`
        }
      }));
    }
  };

  const fetchUpdates = async () => {
    try {
      setUpdatesLoading(true);
      // Store current scroll position
      const scrollPosition = window.scrollY;
      
      const response = await api.get(`/api/alarm-updates/?alarm=${id}`);
      console.log('Raw updates response:', response.data);
      const updatesData: AlarmUpdate[] = response.data.results;
      setUpdates(updatesData);
      
      // Fetch user details for each unique user
      const userIds = [...new Set(updatesData.map(update => update.created_by))];
      await Promise.all(userIds.map(userId => fetchUserDetails(userId)));

      // Restore scroll position after a short delay to ensure content has rendered
      setTimeout(() => {
        window.scrollTo(0, scrollPosition);
      }, 100);
    } catch (err) {
      console.error('Error fetching updates:', err);
    } finally {
      setUpdatesLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/api/current-user/');
      console.log('Current user response:', response.data);
      setCurrentUser(response.data);
    } catch (err) {
      console.error('Error fetching current user:', err);
    }
  };

  useEffect(() => {
    if (id) {
      fetchAlarmDetails();
      fetchUpdates();
      fetchCurrentUser();
    }
  }, [id]);

  const handleEditClick = () => {
    setIsEditModalOpen(true);
  };

  const handleEditClose = () => {
    setIsEditModalOpen(false);
  };

  const handleEditSuccess = () => {
    fetchAlarmDetails();
  };

  const getStatusColor = (stage: string) => {
    switch (stage.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'quote_sent':
        return 'warning';
      case 'to_be_called':
        return 'info';
      case 'to_be_booked':
        return 'primary';
      default:
        return 'primary';
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return format(new Date(date), 'dd/MM/yyyy');
  };

  const formatAddress = (alarm: Alarm) => {
    const parts = [
      alarm.street_number && alarm.street_name ? `${alarm.street_number} ${alarm.street_name}` : null,
      alarm.suburb,
      alarm.state,
      alarm.postal_code,
      alarm.country === 'Australia' ? null : alarm.country
    ].filter(Boolean);
    return parts.join(', ');
  };

  const getUpdateTypeColor = (type: string) => {
    switch (type) {
      case 'call_attempt':
        return 'warning';
      case 'customer_contact':
        return 'success';
      case 'status_change':
        return 'info';
      default:
        return 'primary';
    }
  };

  const formatUpdateType = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const handleUpdateSubmit = async () => {
    try {
      setIsSubmittingUpdate(true);
      setUploadError(null);
      
      // Only create a new update if we have a note and no selectedUpdateId
      if (updateNote.trim() && !selectedUpdateId) {
        const updateResponse = await api.post('/api/alarm-updates/', {
          alarm: id,
          update_type: updateType,
          note: updateNote.trim()
        });
        console.log('Update response:', updateResponse.data);
        
        // If we created a new update, use its timestamp for the images
        if (selectedImages.length > 0) {
          const formData = new FormData();
          formData.append('alarm', id!);
          formData.append('update_time', updateResponse.data.created_at);
          
          // Add description to link images to this specific update
          selectedImages.forEach(image => {
            formData.append('images', image);
          });
          formData.append('description', `update_${updateResponse.data.id}`);

          try {
            const imageResponse = await api.post('/api/alarm-images/', formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
              onUploadProgress: (progressEvent) => {
                const progress = progressEvent.total
                  ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
                  : 0;
                setUploadProgress(progress);
              },
            });
            console.log('Image upload response:', imageResponse.data);
          } catch (uploadErr: any) {
            console.error('Error uploading images:', uploadErr);
            setUploadError(uploadErr.response?.data?.error || 'Failed to upload images');
            return;
          }
        }
      } else if (selectedUpdateId && selectedImages.length > 0) {
        // Adding images to an existing update
        const update = updates.find(u => u.id === selectedUpdateId);
        if (!update) {
          setUploadError('Update not found');
          return;
        }

        console.log('Adding images to existing update:', {
          updateId: selectedUpdateId,
          timestamp: update.created_at
        });

        const formData = new FormData();
        formData.append('alarm', id!);
        formData.append('update_time', update.created_at);
        
        // Add description to link images to this specific update
        selectedImages.forEach(image => {
          formData.append('images', image);
        });
        formData.append('description', `update_${selectedUpdateId}`);

        try {
          const imageResponse = await api.post('/api/alarm-images/', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
              const progress = progressEvent.total
                ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
                : 0;
              setUploadProgress(progress);
            },
          });
          console.log('Image upload response:', imageResponse.data);
        } catch (uploadErr: any) {
          console.error('Error uploading images:', uploadErr);
          setUploadError(uploadErr.response?.data?.error || 'Failed to upload images');
          return;
        }
      }

      // Refresh updates list and alarm details to get new images
      await Promise.all([fetchUpdates(), fetchAlarmDetails()]);

      // Reset form and close modal
      setUpdateType('general_note');
      setUpdateNote('');
      setSelectedImages([]);
      setUploadProgress(0);
      setSelectedUpdateId(null);
      setIsUpdateModalOpen(false);
    } catch (err) {
      console.error('Error submitting update:', err);
    } finally {
      setIsSubmittingUpdate(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedImages(files);
    }
  };

  const removeImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    setSelectedImages(newImages);
  };

  const handleImageClick = (clickedImage: AlarmImage, allImages: AlarmImage[]) => {
    const currentIndex = allImages.findIndex(img => img.id === clickedImage.id);
    setModalState({
      images: allImages,
      currentIndex
    });
  };

  const handlePrevImage = () => {
    if (modalState) {
      setModalState({
        ...modalState,
        currentIndex: (modalState.currentIndex - 1 + modalState.images.length) % modalState.images.length
      });
    }
  };

  const handleNextImage = () => {
    if (modalState) {
      setModalState({
        ...modalState,
        currentIndex: (modalState.currentIndex + 1) % modalState.images.length
      });
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (modalState) {
      if (e.key === 'ArrowLeft') {
        handlePrevImage();
      } else if (e.key === 'ArrowRight') {
        handleNextImage();
      } else if (e.key === 'Escape') {
        setModalState(null);
      }
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [modalState]);

  const handleGalleryUpload = async () => {
    try {
      setIsSubmittingUpdate(true);
      setUploadError(null);
      
      const formData = new FormData();
      formData.append('alarm', id!);
      
      selectedImages.forEach(image => {
        formData.append('images', image);
      });

      const response = await api.post('/api/alarm-images/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          setUploadProgress(progress);
        },
      });
      console.log('Image upload response:', response.data);

      // Refresh updates list and alarm details to get new images
      await Promise.all([fetchUpdates(), fetchAlarmDetails()]);

      // Reset form and close modal
      setSelectedImages([]);
      setUploadProgress(0);
      setIsGalleryUploadModalOpen(false);
    } catch (err: any) {
      console.error('Error uploading images:', err);
      setUploadError(err.response?.data?.error || 'Failed to upload images');
    } finally {
      setIsSubmittingUpdate(false);
    }
  };

  const handleStageChange = async (newStage: 'to_be_booked' | 'quote_sent' | 'completed' | 'to_be_called') => {
    try {
      setIsSubmittingStageChange(true);
      // Store current scroll position
      const scrollPosition = window.scrollY;
      
      // Update both stage and completed status
      await api.patch(`/api/alarms/${id}/`, { 
        stage: newStage,
        completed: newStage === 'completed'
      });
      
      // Create a status change update
      await api.post('/api/alarm-updates/', {
        alarm: id,
        update_type: 'status_change',
        note: `Stage changed to ${newStage.replace(/_/g, ' ').toUpperCase()}`
      });
      
      // Update local state instead of refreshing
      setAlarm(prev => prev ? {
        ...prev,
        stage: newStage,
        completed: newStage === 'completed'
      } : null);
      
      // Still fetch updates since we added a new one
      await fetchUpdates();

      // Restore scroll position after a short delay to ensure content has rendered
      setTimeout(() => {
        window.scrollTo(0, scrollPosition);
      }, 100);
    } catch (err) {
      console.error('Error updating stage:', err);
    } finally {
      setIsSubmittingStageChange(false);
    }
  };

  const toggleStageDropdown = () => {
    setIsStageDropdownOpen(!isStageDropdownOpen);
  };

  const closeStageDropdown = () => {
    setIsStageDropdownOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  if (error || !alarm) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Alarm not found'}</p>
        <Button variant="outline" onClick={() => navigate('/alarms')}>
          Back to Alarms
        </Button>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title={`Alarm Details - ${formatAddress(alarm)} | GHHS - Alarm Management System`}
        description="View detailed alarm information"
      />
      <PageBreadcrumb pageTitle="Alarm Details" />

      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-600 dark:text-gray-400">
              {formatAddress(alarm)}
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/alarms')}
            >
              Back to List
            </Button>
            <Button
              variant="primary"
              onClick={handleEditClick}
            >
              Edit Alarm
            </Button>
          </div>
        </div>

        {/* Updates Section */}
        <ComponentCard title="Updates & Communication History">
          <div className="mb-4 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recent Updates</h3>
            <Button
              variant="primary"
              onClick={() => setIsUpdateModalOpen(true)}
            >
              Add Update
            </Button>
          </div>

          <div className="relative bg-white dark:bg-gray-800 rounded-lg">
            <div className={`transition-all duration-300 ${updatesLoading ? 'blur-[2px]' : ''}`}>
              <div className="overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500" 
                style={{
                  minHeight: '200px',
                  maxHeight: '600px',
                  height: 'auto'
                }}>
                {updates.length > 0 ? (
                  <div className="space-y-4 py-4">
                    {updates.map((update) => {
                      const user = users[update.created_by];
                      const isOwnUpdate = currentUser?.id === update.created_by;
                      
                      console.log('User data for update:', {
                        updateId: update.id,
                        userId: update.created_by,
                        userDetails: user,
                        isOwnUpdate
                      });
                      
                      const userName = user
                        ? `${user.first_name} ${user.last_name}`.trim() || user.email || `User ${update.created_by}`
                        : `User ${update.created_by}`;

                      const matchingImages = alarm.images?.filter(image => {
                        // If the image has a description that matches the update ID, it was uploaded to this specific update
                        if (image.description && image.description.startsWith(`update_${update.id}`)) {
                          return true;
                        }
                        
                        // For legacy images or when no specific update is linked, use timestamp matching
                        const imageTime = new Date(image.uploaded_at).getTime();
                        const updateTime = new Date(update.created_at).getTime();
                        const timeDiff = Math.abs(imageTime - updateTime);
                        // Reduce time window to 10 seconds for more precise matching
                        return timeDiff < 10000; // 10 seconds window
                      }) || [];
                      
                      return (
                        <div key={update.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                              <Avatar 
                                src={`/images/user/user-0${Math.floor(Math.random() * 9) + 1}.jpg`}
                                alt={userName}
                                size="small"
                              />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {userName}
                                  </span>
                                  <Badge
                                    variant="light"
                                    color={getUpdateTypeColor(update.update_type)}
                                  >
                                    {formatUpdateType(update.update_type)}
                                  </Badge>
                                </div>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {format(new Date(update.created_at), 'dd/MM/yyyy HH:mm')}
                                </span>
                              </div>
                            </div>
                            {isOwnUpdate && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setIsUpdateModalOpen(true);
                                  setUpdateType('general_note');
                                  setUpdateNote('');
                                  // Set the update we're adding images to
                                  setSelectedUpdateId(update.id);
                                }}
                              >
                                Add Images
                              </Button>
                            )}
                          </div>
                          <div className="pl-11">
                            <p className="text-gray-800 dark:text-white/90 whitespace-pre-wrap">
                              {update.note}
                            </p>
                            {matchingImages.length > 0 && (
                              <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                                {matchingImages.map((image) => (
                                  <div 
                                    key={image.id} 
                                    className="relative aspect-square w-full cursor-pointer overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800"
                                    onClick={() => handleImageClick(image, matchingImages)}
                                  >
                                    <img
                                      src={image.image_url}
                                      alt="Update attachment"
                                      className="h-full w-full object-cover transition-transform hover:scale-105"
                                      loading="lazy"
                                      onError={(e) => {
                                        const imgElement = e.currentTarget;
                                        if (!imgElement.src.includes('/api/proxy/')) {
                                          const proxyUrl = `/api/proxy/images/?url=${encodeURIComponent(image.image_url)}`;
                                          imgElement.src = proxyUrl;
                                        }
                                      }}
                                    />
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1 text-xs text-white text-center">
                                      {format(new Date(image.uploaded_at), 'dd/MM/yy')}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center">
                    <p className="text-center text-gray-500 dark:text-gray-400">
                      No updates yet. Click "Add Update" to create the first update.
                    </p>
                  </div>
                )}
              </div>
            </div>
            {updatesLoading && (
              <div className="absolute inset-0 flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
              </div>
            )}
          </div>
        </ComponentCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Address Information */}
          <ComponentCard title="Address Information">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Street Address</span>
                <span className="text-gray-900 dark:text-white">
                  {alarm.street_number} {alarm.street_name}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Suburb</span>
                <span className="text-gray-900 dark:text-white">{alarm.suburb || '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">State</span>
                <span className="text-gray-900 dark:text-white">{alarm.state || '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Postal Code</span>
                <span className="text-gray-900 dark:text-white">{alarm.postal_code || '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Country</span>
                <span className="text-gray-900 dark:text-white">{alarm.country || 'Australia'}</span>
              </div>
              
              {/* Map Section */}
              {alarm.latitude && alarm.longitude ? (
                <div className="mt-6 flex flex-col items-center">
                  <div 
                    onClick={() => setIsMapViewerOpen(true)}
                    className="cursor-pointer"
                  >
                    <SmallMap 
                      latitude={alarm.latitude} 
                      longitude={alarm.longitude} 
                      className="w-32 h-32"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                    Click map to view larger
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-4">
                  No map available (missing coordinates)
                </p>
              )}
            </div>
          </ComponentCard>

          {/* Status Card */}
          <ComponentCard title="Status Information">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Current Stage</span>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="light"
                    color={getStatusColor(alarm.stage)}
                  >
                    {alarm.stage.replace(/_/g, ' ').toUpperCase()}
                  </Badge>
                  <div className="relative" style={{ width: '24px', height: '24px' }}>
                    {isSubmittingStageChange ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-brand-500 border-t-transparent"></div>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={toggleStageDropdown}
                          className="dropdown-toggle absolute inset-0 flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition duration-200 hover:border-gray-300 hover:text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300"
                        >
                          <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2.5 4L6 7.5L9.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        {isStageDropdownOpen && (
                          <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-lg border border-gray-200 bg-white p-1.5 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                            <button
                              onClick={() => {
                                handleStageChange('to_be_booked');
                                closeStageDropdown();
                              }}
                              disabled={alarm.stage === 'to_be_booked'}
                              className={`w-full rounded-md px-3 py-1.5 text-left text-sm ${
                                alarm.stage === 'to_be_booked' 
                                  ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed opacity-60' 
                                  : 'text-gray-700 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700'
                              }`}
                            >
                              TO BE BOOKED
                            </button>
                            <button
                              onClick={() => {
                                handleStageChange('quote_sent');
                                closeStageDropdown();
                              }}
                              disabled={alarm.stage === 'quote_sent'}
                              className={`w-full rounded-md px-3 py-1.5 text-left text-sm ${
                                alarm.stage === 'quote_sent' 
                                  ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed opacity-60' 
                                  : 'text-gray-700 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700'
                              }`}
                            >
                              QUOTE SENT
                            </button>
                            <button
                              onClick={() => {
                                handleStageChange('completed');
                                closeStageDropdown();
                              }}
                              disabled={alarm.stage === 'completed'}
                              className={`w-full rounded-md px-3 py-1.5 text-left text-sm ${
                                alarm.stage === 'completed' 
                                  ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed opacity-60' 
                                  : 'text-gray-700 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700'
                              }`}
                            >
                              COMPLETED
                            </button>
                            <button
                              onClick={() => {
                                handleStageChange('to_be_called');
                                closeStageDropdown();
                              }}
                              disabled={alarm.stage === 'to_be_called'}
                              className={`w-full rounded-md px-3 py-1.5 text-left text-sm ${
                                alarm.stage === 'to_be_called' 
                                  ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed opacity-60' 
                                  : 'text-gray-700 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700'
                              }`}
                            >
                              TO BE CALLED
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Completed</span>
                <Badge
                  variant="light"
                  color={alarm.completed ? 'success' : 'warning'}
                >
                  {alarm.completed ? 'YES' : 'NO'}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Sound Type</span>
                <span className="text-gray-900 dark:text-white capitalize">
                  {alarm.sound_type.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Brand</span>
                <span className="text-gray-900 dark:text-white capitalize">
                  {alarm.brand}
                </span>
              </div>
            </div>
          </ComponentCard>

          {/* Property Information */}
          <ComponentCard title="Property Information">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Property Type</span>
                <span className="text-gray-900 dark:text-white">
                  {alarm.is_rental ? 'Rental Property' : 'Private Property'}
                </span>
              </div>
              {alarm.is_rental && alarm.realestate_name && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Real Estate Agency</span>
                  <span className="text-gray-900 dark:text-white">{alarm.realestate_name}</span>
                </div>
              )}
            </div>
          </ComponentCard>

          {/* Contact Information */}
          <ComponentCard title="Contact Information">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Contact Person</span>
                <span className="text-gray-900 dark:text-white">{alarm.who_contacted}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Contact Method</span>
                <span className="text-gray-900 dark:text-white capitalize">{alarm.contact_method}</span>
              </div>
              {alarm.work_order_number && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Work Order Number</span>
                  <span className="text-gray-900 dark:text-white">{alarm.work_order_number}</span>
                </div>
              )}
            </div>
          </ComponentCard>

          {/* Dates Information */}
          <ComponentCard title="Important Dates">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Report Date</span>
                <span className="text-gray-900 dark:text-white">{formatDate(alarm.date)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Installation Date</span>
                <span className="text-gray-900 dark:text-white">{formatDate(alarm.install_date)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Created At</span>
                <span className="text-gray-900 dark:text-white">{format(new Date(alarm.created_at), 'dd/MM/yyyy HH:mm')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Last Updated</span>
                <span className="text-gray-900 dark:text-white">{format(new Date(alarm.updated_at), 'dd/MM/yyyy HH:mm')}</span>
              </div>
            </div>
          </ComponentCard>

          {/* Alarm Details */}
          <ComponentCard title="Alarm System Details">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Hardwire Alarms</span>
                <span className="text-gray-900 dark:text-white">{alarm.hardwire_alarm || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Wireless Alarms</span>
                <span className="text-gray-900 dark:text-white">{alarm.wireless_alarm || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Wall Control</span>
                <Badge
                  variant="light"
                  color={alarm.is_wall_control ? 'success' : 'warning'}
                >
                  {alarm.is_wall_control ? 'YES' : 'NO'}
                </Badge>
              </div>
            </div>
          </ComponentCard>

          {/* Tenant Information */}
          <ComponentCard title="Tenant Information">
            {alarm.tenants.length > 0 ? (
              <div className="space-y-4">
                {alarm.tenants.map((tenant) => (
                  <div key={tenant.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-900 dark:text-white font-medium">{tenant.name}</span>
                      <span className="text-gray-600 dark:text-gray-400">{tenant.phone}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                No tenant information available
              </p>
            )}
          </ComponentCard>

          {/* All Images Gallery */}
          <ComponentCard title="Image Gallery">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {alarm.images && alarm.images.length > 0 
                  ? `All images uploaded for this alarm (${alarm.images.length} total)`
                  : 'No images uploaded yet'}
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsGalleryUploadModalOpen(true)}
              >
                Upload Images
              </Button>
            </div>
            {alarm.images && alarm.images.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {alarm.images.map((image) => (
                  <div 
                    key={image.id} 
                    className="relative w-24 h-24 cursor-pointer overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 group flex-shrink-0"
                    onClick={() => handleImageClick(image, alarm.images || [])}
                  >
                    <img
                      src={image.image_url}
                      alt={`Image ${image.id}`}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => {
                        const imgElement = e.currentTarget;
                        if (!imgElement.src.includes('/api/proxy/')) {
                          const proxyUrl = `/api/proxy/images/?url=${encodeURIComponent(image.image_url)}`;
                          imgElement.src = proxyUrl;
                        }
                      }}
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-1">
                      <div className="text-[10px] text-white text-center font-medium">
                        {format(new Date(image.uploaded_at), 'dd/MM/yy HH:mm')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                No images uploaded yet
              </p>
            )}
          </ComponentCard>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={handleEditClose}
        className="w-full mx-4"
      >
        <AlarmForm
          onClose={handleEditClose}
          onSuccess={handleEditSuccess}
          initialData={alarm || undefined}
        />
      </Modal>

      {/* Map Viewer Modal */}
      {alarm && alarm.latitude && alarm.longitude && (
        <MapViewerModal
          isOpen={isMapViewerOpen}
          onClose={() => setIsMapViewerOpen(false)}
          latitude={alarm.latitude}
          longitude={alarm.longitude}
          title={`Map View - ${formatAddress(alarm)}`}
        />
      )}

      {/* Update Modal */}
      <Modal
        isOpen={isUpdateModalOpen}
        onClose={() => {
          setIsUpdateModalOpen(false);
          setSelectedImages([]);
          setUploadProgress(0);
          setSelectedUpdateId(null);
          setUpdateNote('');
          setUploadError(null);
        }}
        className="max-w-2xl"
      >
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            {selectedUpdateId ? 'Add Images to Update' : 'Add Update'}
          </h3>
          <div className="space-y-4">
            {!selectedUpdateId && (
              <>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Update Type
                  </label>
                  <select
                    value={updateType}
                    onChange={(e) => setUpdateType(e.target.value as AlarmUpdate['update_type'])}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  >
                    <option value="call_attempt">Call Attempt</option>
                    <option value="customer_contact">Customer Contact</option>
                    <option value="status_change">Status Change</option>
                    <option value="general_note">General Note</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Note
                  </label>
                  <textarea
                    value={updateNote}
                    onChange={(e) => setUpdateNote(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    placeholder="Enter update details..."
                  />
                </div>
              </>
            )}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Images
              </label>
              <div className="space-y-4">
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                      </svg>
                      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG or JPEG</p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      multiple 
                      accept="image/*"
                      onChange={handleImageSelect}
                      disabled={isSubmittingUpdate}
                    />
                  </label>
                </div>
                {uploadError && (
                  <div className="text-sm text-red-600 dark:text-red-400 text-center">
                    {uploadError}
                  </div>
                )}
                {selectedImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    {selectedImages.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Selected ${index + 1}`}
                          className="h-24 w-full object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          disabled={isSubmittingUpdate}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-4">
                    <div 
                      className="bg-brand-500 h-2.5 rounded-full" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setIsUpdateModalOpen(false);
                  setSelectedImages([]);
                  setUploadProgress(0);
                  setSelectedUpdateId(null);
                  setUpdateNote('');
                  setUploadError(null);
                }}
                disabled={isSubmittingUpdate}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleUpdateSubmit}
                disabled={isSubmittingUpdate || (selectedUpdateId ? selectedImages.length === 0 : !updateNote.trim())}
              >
                {isSubmittingUpdate ? 'Saving...' : (selectedUpdateId ? 'Add Images' : 'Save Update')}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Image Viewer Modal */}
      <Modal
        isOpen={!!modalState}
        onClose={() => setModalState(null)}
        className="max-w-4xl"
      >
        {modalState && modalState.images.length > 0 && (
          <div className="relative">
            <img
              src={modalState.images[modalState.currentIndex].image_url}
              alt="Full size"
              className="w-full h-auto rounded-lg"
            />
            {modalState.images.length > 1 && (
              <>
                {/* Left Arrow */}
                <button
                  onClick={handlePrevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                  aria-label="Previous image"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                {/* Right Arrow */}
                <button
                  onClick={handleNextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                  aria-label="Next image"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                {/* Image Counter */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {modalState.currentIndex + 1} / {modalState.images.length}
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Gallery Upload Modal */}
      <Modal
        isOpen={isGalleryUploadModalOpen}
        onClose={() => {
          setIsGalleryUploadModalOpen(false);
          setSelectedImages([]);
          setUploadProgress(0);
          setUploadError(null);
        }}
        className="max-w-2xl"
      >
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Upload Images to Gallery
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Images
              </label>
              <div className="space-y-4">
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                      </svg>
                      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG or JPEG</p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      multiple 
                      accept="image/*"
                      onChange={handleImageSelect}
                      disabled={isSubmittingUpdate}
                    />
                  </label>
                </div>
                {uploadError && (
                  <div className="text-sm text-red-600 dark:text-red-400 text-center">
                    {uploadError}
                  </div>
                )}
                {selectedImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    {selectedImages.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Selected ${index + 1}`}
                          className="h-24 w-full object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          disabled={isSubmittingUpdate}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-4">
                    <div 
                      className="bg-brand-500 h-2.5 rounded-full" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setIsGalleryUploadModalOpen(false);
                  setSelectedImages([]);
                  setUploadProgress(0);
                  setUploadError(null);
                }}
                disabled={isSubmittingUpdate}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleGalleryUpload}
                disabled={isSubmittingUpdate || selectedImages.length === 0}
              >
                {isSubmittingUpdate ? 'Uploading...' : 'Upload Images'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
} 