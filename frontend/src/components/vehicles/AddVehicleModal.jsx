import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Car, Loader2, Sparkles, Search, Upload, Image as ImageIcon, X } from 'lucide-react';
import apiClient from '@/api/client';
import { useLanguage } from '@/components/LanguageProvider';
import { toast } from 'sonner';

const platforms = [
  { id: 'turo', label: 'Turo' },
  { id: 'getaround', label: 'Getaround' },
  { id: 'hunos_rent', label: 'Hunos Rent' }
];

export default function AddVehicleModal({ open, onClose, onSave, isLoading }) {
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
  const [isEnriching, setIsEnriching] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const handlePlatformChange = (platformId, checked) => {
    setFormData(prev => ({
      ...prev,
      platforms: checked 
        ? [...prev.platforms, platformId]
        : prev.platforms.filter(p => p !== platformId)
    }));
  };

  const enrichVehicleData = async () => {
    if (!formData.vin && !formData.license_plate) return;
    
    setIsEnriching(true);
    try {
      const identifier = formData.vin || formData.license_plate;
      const identifierType = formData.vin ? 'VIN' : 'license plate';
      
      // Fetch vehicle details using LLM with web search
      const vehicleInfo = await apiClient.integrations.Core.InvokeLLM({
        prompt: `Look up vehicle information for ${identifierType}: ${identifier}. Return the year, make, model, and find a high-quality photo URL of this exact vehicle model.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            year: { type: "number" },
            make: { type: "string" },
            model: { type: "string" },
            image_url: { type: "string" }
          }
        }
      });

      if (vehicleInfo.year && vehicleInfo.make && vehicleInfo.model) {
        setFormData(prev => ({
          ...prev,
          year: vehicleInfo.year.toString(),
          make: vehicleInfo.make,
          model: vehicleInfo.model,
          image_url: vehicleInfo.image_url || prev.image_url,
          name: prev.name || `${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}`
        }));
      }
    } catch (error) {
      console.error('Failed to enrich vehicle data:', error);
    } finally {
      setIsEnriching(false);
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let finalImageUrl = formData.image_url;
    
    // If no valid image and we have vehicle details, generate one with AI
    if ((!finalImageUrl || !finalImageUrl.includes('unsplash.com')) && formData.make && formData.model) {
      setIsGeneratingImage(true);
      try {
        const prompt = `Professional product photo of a ${formData.year || ''} ${formData.make} ${formData.model}, studio lighting, 3/4 front view, clean background, high quality, automotive photography, realistic`;
        const { url } = await apiClient.integrations.Core.GenerateImage({ prompt });
        finalImageUrl = url;
        toast.success('Photo générée automatiquement avec IA');
      } catch (error) {
        console.error('Failed to generate image:', error);
        toast.error('Impossible de générer la photo automatiquement');
      } finally {
        setIsGeneratingImage(false);
      }
    }
    
    onSave({
      ...formData,
      image_url: finalImageUrl,
      year: formData.year ? parseInt(formData.year) : null
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            {t('addVehicle.title')}
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

            {/* VIN/License Plate Auto-Enrichment */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <Label className="text-blue-900 font-medium">{t('addVehicle.autoFill')}</Label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="vin" className="text-sm text-blue-800">{t('addVehicle.vin')}</Label>
                  <Input
                    id="vin"
                    placeholder="1HGBH41JXMN109186"
                    value={formData.vin}
                    onChange={(e) => setFormData(prev => ({ ...prev, vin: e.target.value }))}
                    className="mt-1"
                    maxLength={17}
                  />
                </div>
                <div>
                  <Label htmlFor="license_plate_enrichment" className="text-sm text-blue-800">{t('addVehicle.licensePlate')}</Label>
                  <Input
                    id="license_plate_enrichment"
                    placeholder="ABC-1234"
                    value={formData.license_plate}
                    onChange={(e) => setFormData(prev => ({ ...prev, license_plate: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
              <Button
                type="button"
                onClick={enrichVehicleData}
                disabled={isEnriching || (!formData.vin && !formData.license_plate)}
                className="w-full mt-3 bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                {isEnriching ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('addVehicle.lookingUp')}
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    {t('addVehicle.autoFillButton')}
                  </>
                )}
              </Button>
            </div>

            <div>
              <Label htmlFor="name">{t('addVehicle.name')}</Label>
              <Input
                id="name"
                placeholder={t('addVehicle.namePlaceholder')}
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1.5"
                required
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="year">{t('addVehicle.year')}</Label>
                <Input
                  id="year"
                  type="number"
                  placeholder="2023"
                  value={formData.year}
                  onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="make">{t('addVehicle.make')}</Label>
                <Input
                  id="make"
                  placeholder="Tesla"
                  value={formData.make}
                  onChange={(e) => setFormData(prev => ({ ...prev, make: e.target.value }))}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="model">{t('addVehicle.model')}</Label>
                <Input
                  id="model"
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
                      id={platform.id}
                      checked={formData.platforms.includes(platform.id)}
                      onCheckedChange={(checked) => handlePlatformChange(platform.id, checked)}
                    />
                    <Label htmlFor={platform.id} className="font-normal cursor-pointer">
                      {platform.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <Label htmlFor="calendar">{t('addVehicle.calendar')}</Label>
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
              {t('addVehicle.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading || isGeneratingImage || !formData.name}>
              {isLoading || isGeneratingImage ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('addVehicle.adding')}
                </>
              ) : (
                t('addVehicle.add')
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}