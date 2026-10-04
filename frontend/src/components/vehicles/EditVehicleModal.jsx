import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Car, Loader2, Upload, Image as ImageIcon, X } from 'lucide-react';
import apiClient from '@/api/client';
import { useLanguage } from '@/components/LanguageProvider';

const platforms = [
  { id: 'turo', label: 'Turo' },
  { id: 'getaround', label: 'Getaround' },
  { id: 'hunos_rent', label: 'Hunos Rent' }
];

export default function EditVehicleModal({ open, onClose, vehicle, onSave, isLoading }) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    license_plate: '',
    vin: '',
    year: '',
    make: '',
    model: '',
    platforms: [],
    calendar_provider: 'none',
    image_url: ''
  });
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  useEffect(() => {
    if (vehicle) {
      setFormData({
        name: vehicle.name || '',
        license_plate: vehicle.license_plate || '',
        vin: vehicle.vin || '',
        year: vehicle.year?.toString() || '',
        make: vehicle.make || '',
        model: vehicle.model || '',
        platforms: vehicle.platforms || [],
        calendar_provider: vehicle.calendar_provider || 'none',
        image_url: vehicle.image_url || ''
      });
    }
  }, [vehicle]);

  const handlePlatformChange = (platformId, checked) => {
    setFormData(prev => ({
      ...prev,
      platforms: checked 
        ? [...prev.platforms, platformId]
        : prev.platforms.filter(p => p !== platformId)
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const { file_url } = await apiClient.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, image_url: file_url }));
    } catch (error) {
      console.error('Failed to upload image:', error);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const generateVehicleImage = async () => {
    if (!formData.make || !formData.model) return;

    setIsGeneratingImage(true);
    try {
      const prompt = `Professional product photo of a ${formData.year || ''} ${formData.make} ${formData.model}, studio lighting, 3/4 front view, clean background, high quality, automotive photography`;
      const { url } = await apiClient.integrations.Core.GenerateImage({ prompt });
      setFormData(prev => ({ ...prev, image_url: url }));
    } catch (error) {
      console.error('Failed to generate image:', error);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      year: formData.year ? parseInt(formData.year) : null
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            Modifier le véhicule
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-4">
            {/* Vehicle Image Upload */}
            <div>
              <Label className="mb-2 block">Photo du véhicule</Label>
              {formData.image_url ? (
                <div className="relative">
                  <img 
                    src={formData.image_url} 
                    alt="Vehicle" 
                    className="w-full h-48 object-cover rounded-xl border border-slate-200"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {isUploadingImage ? (
                        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-slate-400 mb-2" />
                          <p className="text-sm text-slate-600">Cliquez pour télécharger une photo</p>
                        </>
                      )}
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploadingImage}
                    />
                  </label>
                  {formData.make && formData.model && (
                    <Button
                      type="button"
                      onClick={generateVehicleImage}
                      disabled={isGeneratingImage}
                      variant="outline"
                      className="w-full"
                      size="sm"
                    >
                      {isGeneratingImage ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Génération en cours...
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-4 h-4 mr-2" />
                          Générer une photo avec IA
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="edit-name">{t('addVehicle.name')}</Label>
              <Input
                id="edit-name"
                placeholder={t('addVehicle.namePlaceholder')}
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1.5"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-vin">VIN</Label>
                <Input
                  id="edit-vin"
                  placeholder="1HGBH41JXMN109186"
                  value={formData.vin}
                  onChange={(e) => setFormData(prev => ({ ...prev, vin: e.target.value }))}
                  className="mt-1.5"
                  maxLength={17}
                />
              </div>
              <div>
                <Label htmlFor="edit-license">Plaque</Label>
                <Input
                  id="edit-license"
                  placeholder="ABC-1234"
                  value={formData.license_plate}
                  onChange={(e) => setFormData(prev => ({ ...prev, license_plate: e.target.value }))}
                  className="mt-1.5"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-year">{t('addVehicle.year')}</Label>
                <Input
                  id="edit-year"
                  type="number"
                  placeholder="2023"
                  value={formData.year}
                  onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="edit-make">{t('addVehicle.make')}</Label>
                <Input
                  id="edit-make"
                  placeholder="Tesla"
                  value={formData.make}
                  onChange={(e) => setFormData(prev => ({ ...prev, make: e.target.value }))}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="edit-model">{t('addVehicle.model')}</Label>
                <Input
                  id="edit-model"
                  placeholder="Model 3"
                  value={formData.model}
                  onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                  className="mt-1.5"
                />
              </div>
            </div>
            
            <div>
              <Label className="mb-3 block">{t('addVehicle.platforms')}</Label>
              <div className="flex flex-wrap gap-4">
                {platforms.map((platform) => (
                  <div key={platform.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`edit-${platform.id}`}
                      checked={formData.platforms.includes(platform.id)}
                      onCheckedChange={(checked) => handlePlatformChange(platform.id, checked)}
                    />
                    <Label htmlFor={`edit-${platform.id}`} className="font-normal cursor-pointer">
                      {platform.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit-calendar">{t('addVehicle.calendar')}</Label>
              <Select
                value={formData.calendar_provider}
                onValueChange={(value) => setFormData(prev => ({ ...prev, calendar_provider: value }))}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('addVehicle.noCalendar')}</SelectItem>
                  <SelectItem value="google">{t('addVehicle.googleCalendar')}</SelectItem>
                  <SelectItem value="outlook">{t('addVehicle.outlookCalendar')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading || !formData.name}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}