import { useState } from "react";
import { Button } from "./components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./components/ui/dialog";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Textarea } from "./components/ui/textarea";
import { Calendar } from "./components/ui/calendar";
import { 
  ChevronLeft, 
  ChevronRight, 
  Upload, 
  X,
  Droplet,
  Zap,
  Key,
  Wrench,
  Home,
  Wind,
  Hammer,
  PaintBucket,
  Check,
  Clock
} from "lucide-react";
import { cn } from "./lib/utils";
import { format, addDays, startOfToday, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormData {
  postalCode: string;
  serviceType: string;
  serviceCategory: string; // Repair, Maintenance, Other
  serviceDetail: string; // Unclog Drain, Repair faucet, etc.
  serviceScope: string; // Point of use, Whole home system
  photos: File[];
  description: string;
  preferredDate: Date | null;
  preferredTimeSlot: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  interventionAddress: string;
  interventionAddressLine2: string;
  interventionCity: string;
  interventionPostalCode: string;
}

const serviceTypes = [
  { id: "plomberie", label: "Plomberie", icon: Droplet },
  { id: "electricite", label: "Électricité", icon: Zap },
  { id: "serrurerie", label: "Serrurerie", icon: Key },
  { id: "chauffage", label: "Chauffage", icon: Wind },
  { id: "menuiserie", label: "Menuiserie", icon: Hammer },
  { id: "peinture", label: "Peinture", icon: PaintBucket },
  { id: "renovation", label: "Rénovation", icon: Home },
  { id: "autre", label: "Autre", icon: Wrench },
];

const timeSlots = [
  { id: "morning", label: "Matin (8h-12h)", time: "8h-12h" },
  { id: "afternoon", label: "Après-midi (12h-18h)", time: "12h-18h" },
  { id: "evening", label: "Soirée (18h-20h)", time: "18h-20h" },
];

// Helper pour générer les premières disponibilités (5 prochains créneaux)
const getFirstAvailableSlots = () => {
  const slots: { date: Date; timeSlot: { id: string; label: string; time: string } }[] = [];
  const days = Array.from({ length: 14 }, (_, i) => addDays(startOfToday(), i + 1)); // Next 14 days
  
  for (const day of days) {
    for (const slot of timeSlots) {
      slots.push({ date: day, timeSlot: slot });
      if (slots.length >= 6) return slots;
    }
  }
  return slots;
};

// Helper pour calculer le prix estimé en fonction du service
const calculateEstimatedPrice = (serviceType: string, serviceCategory: string, serviceScope: string): number => {
  // Prix de base par type de service
  const basePrices: Record<string, number> = {
    plomberie: 80,
    electricite: 90,
    serrurerie: 120,
    chauffage: 100,
    menuiserie: 85,
    peinture: 70,
    renovation: 150,
    autre: 75,
  };

  let price = basePrices[serviceType] || 75;

  // Ajustement selon la catégorie
  if (serviceCategory === "installation") {
    price *= 1.5; // Installation coûte plus cher
  } else if (serviceCategory === "maintenance") {
    price *= 0.8; // Maintenance moins cher
  }

  // Ajustement selon la portée (plomberie uniquement)
  if (serviceType === "plomberie" && serviceScope === "whole-home") {
    price *= 1.8; // Système complet plus cher
  }

  return Math.round(price);
};

// Questions détaillées par profession
const plumberieQuestions = {
  categories: [
    { id: "repair", label: "Réparation" },
    { id: "maintenance", label: "Maintenance" },
    { id: "installation", label: "Installation" },
    { id: "other", label: "Autre" },
  ],
  repairDetails: [
    { id: "unclog-drain", label: "Déboucher un drain" },
    { id: "repair-faucet", label: "Réparer un robinet" },
    { id: "repair-garbage-disposal", label: "Réparer un broyeur" },
    { id: "repair-outdoor-systems", label: "Réparer systèmes extérieurs" },
    { id: "repair-pipe", label: "Réparer une canalisation" },
    { id: "repair-sewer", label: "Réparer les égouts" },
    { id: "repair-shower", label: "Réparer une douche" },
    { id: "repair-toilet", label: "Réparer des toilettes" },
    { id: "repair-water-heater", label: "Réparer chauffe-eau" },
    { id: "find-repair-leak", label: "Trouver et réparer fuite" },
    { id: "repair-other", label: "Autre" },
  ],
  maintenanceDetails: [
    { id: "routine-inspection", label: "Inspection de routine" },
    { id: "clean-drains", label: "Nettoyer les canalisations" },
    { id: "check-water-pressure", label: "Vérifier la pression d'eau" },
    { id: "water-heater-maintenance", label: "Entretien chauffe-eau" },
    { id: "maintenance-other", label: "Autre" },
  ],
  installationDetails: [
    { id: "install-faucet", label: "Installer un robinet" },
    { id: "install-toilet", label: "Installer des toilettes" },
    { id: "install-shower", label: "Installer une douche" },
    { id: "install-water-heater", label: "Installer un chauffe-eau" },
    { id: "install-dishwasher", label: "Installer un lave-vaisselle" },
    { id: "installation-other", label: "Autre" },
  ],
  otherDetails: [
    { id: "consultation", label: "Consultation" },
    { id: "estimate", label: "Devis" },
    { id: "other-service", label: "Autre service" },
  ],
  scopes: [
    { id: "point-of-use", label: "Point d'utilisation" },
    { id: "whole-home", label: "Système complet" },
    { id: "scope-other", label: "Autre" },
  ],
};

const electriciteQuestions = {
  categories: [
    { id: "repair", label: "Réparation" },
    { id: "maintenance", label: "Maintenance" },
    { id: "installation", label: "Installation" },
    { id: "other", label: "Autre" },
  ],
  repairDetails: [
    { id: "fix-outlet", label: "Réparer une prise" },
    { id: "fix-switch", label: "Réparer un interrupteur" },
    { id: "fix-circuit-breaker", label: "Réparer disjoncteur" },
    { id: "fix-lighting", label: "Réparer éclairage" },
    { id: "electrical-fault", label: "Panne électrique" },
    { id: "repair-other", label: "Autre" },
  ],
  maintenanceDetails: [
    { id: "electrical-inspection", label: "Inspection électrique" },
    { id: "panel-upgrade", label: "Mise à niveau du tableau" },
    { id: "safety-check", label: "Contrôle de sécurité" },
    { id: "maintenance-other", label: "Autre" },
  ],
  installationDetails: [
    { id: "install-outlet", label: "Installer une prise" },
    { id: "install-lighting", label: "Installer éclairage" },
    { id: "install-ceiling-fan", label: "Installer ventilateur" },
    { id: "install-smart-home", label: "Installation domotique" },
    { id: "installation-other", label: "Autre" },
  ],
  otherDetails: [
    { id: "consultation", label: "Consultation" },
    { id: "estimate", label: "Devis" },
    { id: "other-service", label: "Autre service" },
  ],
};

const chauffageQuestions = {
  categories: [
    { id: "repair", label: "Réparation" },
    { id: "maintenance", label: "Maintenance" },
    { id: "installation", label: "Installation" },
    { id: "other", label: "Autre" },
  ],
  repairDetails: [
    { id: "no-heat", label: "Pas de chauffage" },
    { id: "strange-noise", label: "Bruits anormaux" },
    { id: "thermostat-issue", label: "Problème de thermostat" },
    { id: "radiator-leak", label: "Fuite radiateur" },
    { id: "repair-other", label: "Autre" },
  ],
  maintenanceDetails: [
    { id: "annual-service", label: "Entretien annuel" },
    { id: "boiler-service", label: "Entretien chaudière" },
    { id: "system-cleaning", label: "Nettoyage du système" },
    { id: "maintenance-other", label: "Autre" },
  ],
  installationDetails: [
    { id: "new-boiler", label: "Nouvelle chaudière" },
    { id: "new-radiator", label: "Nouveau radiateur" },
    { id: "thermostat-install", label: "Installation thermostat" },
    { id: "installation-other", label: "Autre" },
  ],
  otherDetails: [
    { id: "consultation", label: "Consultation" },
    { id: "estimate", label: "Devis" },
    { id: "other-service", label: "Autre service" },
  ],
};

export const AppointmentDialog = ({ open, onOpenChange }: AppointmentDialogProps) => {
  const [step, setStep] = useState(1);
  const [appointmentMode, setAppointmentMode] = useState<'first' | 'all'>('first'); // Mode de sélection
  const [formData, setFormData] = useState<FormData>({
    postalCode: "",
    serviceType: "",
    serviceCategory: "",
    serviceDetail: "",
    serviceScope: "",
    photos: [],
    description: "",
    preferredDate: null,
    preferredTimeSlot: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    interventionAddress: "",
    interventionAddressLine2: "",
    interventionCity: "",
    interventionPostalCode: "",
  });

  const totalSteps = 10; // 10 étapes avec prix estimé, adresse d'intervention et récapitulatif final

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({
      ...prev,
      photos: [...prev.photos, ...files]
    }));
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = () => {
    console.log("Form submitted:", formData);
    // Ici, vous pouvez ajouter la logique pour envoyer les données au backend
    onOpenChange(false);
    // Réinitialiser le formulaire
    setStep(1);
    setAppointmentMode('first');
    setFormData({
      postalCode: "",
      serviceType: "",
      serviceCategory: "",
      serviceDetail: "",
      serviceScope: "",
      photos: [],
      description: "",
      preferredDate: null,
      preferredTimeSlot: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      interventionAddress: "",
      interventionAddressLine2: "",
      interventionCity: "",
      interventionPostalCode: "",
    });
  };

  // Obtenir les questions spécifiques selon le type de service
  const getServiceQuestions = () => {
    switch (formData.serviceType) {
      case "plomberie":
        return plumberieQuestions;
      case "electricite":
        return electriciteQuestions;
      case "chauffage":
        return chauffageQuestions;
      default:
        return null;
    }
  };

  // Obtenir les détails selon la catégorie
  const getDetailsForCategory = () => {
    const questions = getServiceQuestions();
    if (!questions) return [];
    
    switch (formData.serviceCategory) {
      case "repair":
        return questions.repairDetails || [];
      case "maintenance":
        return questions.maintenanceDetails || [];
      case "installation":
        return questions.installationDetails || [];
      case "other":
        return questions.otherDetails || [];
      default:
        return [];
    }
  };

  const isStepValid = () => {
    const hasDetailedQuestions = ["plomberie", "electricite", "chauffage"].includes(formData.serviceType);
    
    switch (step) {
      case 1:
        return formData.postalCode.length === 5 && /^\d+$/.test(formData.postalCode);
      case 2:
        return formData.serviceType !== "";
      case 3:
        // Étape des questions détaillées (toutes sur une page)
        if (hasDetailedQuestions) {
          // Validation progressive : catégorie et détails requis
          const hasCategory = formData.serviceCategory !== "";
          const hasDetail = formData.serviceDetail !== "";
          const hasScope = formData.serviceType === "plomberie" ? formData.serviceScope !== "" : true;
          return hasCategory && hasDetail && hasScope;
        }
        return true; // Photos optionnelles pour les autres services
      case 4:
        return true; // Photos sont optionnelles
      case 5:
        return formData.description.trim().length > 0;
      case 6:
        return formData.preferredDate !== null && formData.preferredTimeSlot !== "";
      case 7:
        return true; // Prix estimé - toujours valide
      case 8:
        return (
          formData.firstName.trim() !== "" &&
          formData.lastName.trim() !== "" &&
          formData.email.trim() !== "" &&
          formData.phone.trim() !== ""
        );
      case 9:
        return (
          formData.interventionAddress.trim() !== "" &&
          formData.interventionCity.trim() !== "" &&
          formData.interventionPostalCode.length === 5 &&
          /^\d+$/.test(formData.interventionPostalCode)
        );
      case 10:
        return true; // Récapitulatif - toujours valide si on y arrive
      default:
        return false;
    }
  };

  const getStepTitle = () => {
    const hasDetailedQuestions = ["plomberie", "electricite", "chauffage"].includes(formData.serviceType);
    
    switch (step) {
      case 1:
        return "Où se situe votre intervention ?";
      case 2:
        return "Quel type d'aide vous faut-il ?";
      case 3:
        return hasDetailedQuestions ? "Détails de votre demande" : "Ajoutez des photos (optionnel)";
      case 4:
        return "Ajoutez des photos (optionnel)";
      case 5:
        return "Décrivez votre problème";
      case 6:
        return "Choisissez un créneau";
      case 7:
        return "Prix estimé de l'intervention";
      case 8:
        return "Vos informations personnelles";
      case 9:
        return "Adresse de l'intervention";
      case 10:
        return "Récapitulatif de votre demande";
      default:
        return "";
    }
  };

  const getStepDescription = () => {
    const hasDetailedQuestions = ["plomberie", "electricite", "chauffage"].includes(formData.serviceType);
    
    switch (step) {
      case 1:
        return "Entrez votre code postal pour trouver des professionnels près de chez vous";
      case 2:
        return "Sélectionnez le type de service dont vous avez besoin";
      case 3:
        return hasDetailedQuestions 
          ? "Répondez aux questions suivantes pour mieux définir votre besoin"
          : "Des photos aideront le professionnel à mieux comprendre votre besoin";
      case 4:
        return "Des photos aideront le professionnel à mieux comprendre votre besoin";
      case 5:
        return "Expliquez en détail le problème que vous rencontrez";
      case 6:
        return "Sélectionnez une date et un créneau horaire pour l'intervention";
      case 7:
        return "Voici une estimation du coût de votre intervention basée sur vos informations";
      case 8:
        return "Nous avons besoin de ces informations pour vous contacter";
      case 9:
        return "Indiquez l'adresse exacte où doit avoir lieu l'intervention";
      case 10:
        return "Vérifiez vos informations avant de confirmer";
      default:
        return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{getStepTitle()}</DialogTitle>
          <DialogDescription>{getStepDescription()}</DialogDescription>
        </DialogHeader>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Étape {step} sur {totalSteps}</span>
            <span>{Math.round((step / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="py-6">
          {/* Step 1: Code Postal */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="postalCode">Code postal</Label>
                <Input
                  id="postalCode"
                  placeholder="Ex: 75001"
                  value={formData.postalCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 5);
                    setFormData(prev => ({ ...prev, postalCode: value }));
                  }}
                  maxLength={5}
                  className="text-lg"
                />
                {formData.postalCode && !isStepValid() && (
                  <p className="text-sm text-destructive">
                    Le code postal doit contenir 5 chiffres
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Type de service */}
          {step === 2 && (
            <div className="grid grid-cols-2 gap-3">
              {serviceTypes.map((service) => {
                const Icon = service.icon;
                return (
                  <button
                    key={service.id}
                    onClick={() => setFormData(prev => ({ 
                      ...prev, 
                      serviceType: service.id,
                      serviceCategory: "",
                      serviceDetail: "",
                      serviceScope: ""
                    }))}
                    className={cn(
                      "flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all",
                      formData.serviceType === service.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50 hover:bg-secondary/50"
                    )}
                  >
                    <Icon className={cn(
                      "h-8 w-8",
                      formData.serviceType === service.id ? "text-primary" : "text-muted-foreground"
                    )} />
                    <span className={cn(
                      "text-sm font-medium",
                      formData.serviceType === service.id ? "text-primary" : "text-foreground"
                    )}>
                      {service.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Step 3: Questions détaillées (toutes sur une page) */}
          {step === 3 && ["plomberie", "electricite", "chauffage"].includes(formData.serviceType) && (
            <div className="space-y-6">
              {/* Question 1: Sélectionnez votre service */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold">Sélectionnez votre service</h3>
                <div className="grid grid-cols-2 gap-3">
                  {getServiceQuestions()?.categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setFormData(prev => ({ 
                        ...prev, 
                        serviceCategory: category.id,
                        serviceDetail: "" // Reset detail when category changes
                      }))}
                      className={cn(
                        "flex items-center justify-center p-4 rounded-xl border-2 transition-all text-center font-medium",
                        formData.serviceCategory === category.id
                          ? "border-primary bg-primary text-white"
                          : "border-border hover:border-primary/50 hover:bg-secondary/50"
                      )}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 2: Que faut-il faire ? (apparait après avoir sélectionné la catégorie) */}
              {formData.serviceCategory && (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <h3 className="text-lg font-bold">
                    {formData.serviceCategory === "repair" && "Que faut-il réparer ?"}
                    {formData.serviceCategory === "maintenance" && "Quel type de maintenance ?"}
                    {formData.serviceCategory === "installation" && "Que faut-il installer ?"}
                    {formData.serviceCategory === "other" && "Quel type de service recherchez-vous ?"}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {getDetailsForCategory().map((detail) => (
                      <button
                        key={detail.id}
                        onClick={() => setFormData(prev => ({ ...prev, serviceDetail: detail.id }))}
                        className={cn(
                          "flex items-center justify-center p-4 rounded-xl border-2 transition-all text-center text-sm font-medium min-h-[80px]",
                          formData.serviceDetail === detail.id
                            ? "border-primary bg-primary text-white"
                            : "border-border hover:border-primary/50 hover:bg-secondary/50"
                        )}
                      >
                        {detail.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Question 3: Portée (uniquement pour plomberie, apparait après avoir sélectionné le détail) */}
              {formData.serviceType === "plomberie" && formData.serviceDetail && (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <h3 className="text-lg font-bold">Est-ce un point d'utilisation ou un système complet ?</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {plumberieQuestions.scopes.map((scope) => (
                      <button
                        key={scope.id}
                        onClick={() => setFormData(prev => ({ ...prev, serviceScope: scope.id }))}
                        className={cn(
                          "flex items-center justify-center p-6 rounded-xl border-2 transition-all text-center font-medium",
                          formData.serviceScope === scope.id
                            ? "border-primary bg-primary text-white"
                            : "border-border hover:border-primary/50 hover:bg-secondary/50"
                        )}
                      >
                        {scope.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3 (services sans questions détaillées) ou Step 4: Photos */}
          {((step === 3 && !["plomberie", "electricite", "chauffage"].includes(formData.serviceType)) ||
            step === 4) && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  id="photo-upload"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <label
                  htmlFor="photo-upload"
                  className="cursor-pointer flex flex-col items-center gap-3"
                >
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Cliquez pour ajouter des photos</p>
                    <p className="text-sm text-muted-foreground">ou glissez-déposez vos fichiers</p>
                  </div>
                  <p className="text-xs text-muted-foreground">PNG, JPG, JPEG jusqu'à 10MB</p>
                </label>
              </div>

              {/* Preview des photos */}
              {formData.photos.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {formData.photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 5: Description */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description du problème</Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez votre problème en détail... Par exemple : 'Fuite d'eau sous l'évier de la cuisine, l'eau coule continuellement...'"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={8}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  {formData.description.length} caractères
                </p>
              </div>
            </div>
          )}

          {/* Step 6: Créneaux de date */}
          {step === 6 && (
            <div className="space-y-6">
              {/* Toggle entre Premières disponibilités et Tous les créneaux */}
              <div className="bg-secondary/50 p-1 rounded-lg flex gap-1">
                <button
                  onClick={() => {
                    setAppointmentMode('first');
                    setFormData(prev => ({ ...prev, preferredDate: null, preferredTimeSlot: "" }));
                  }}
                  className={cn(
                    "flex-1 py-3 px-4 rounded-md font-semibold text-sm transition-all",
                    appointmentMode === 'first'
                      ? "bg-white text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Premières disponibilités
                </button>
                <button
                  onClick={() => {
                    setAppointmentMode('all');
                    setFormData(prev => ({ ...prev, preferredDate: null, preferredTimeSlot: "" }));
                  }}
                  className={cn(
                    "flex-1 py-3 px-4 rounded-md font-semibold text-sm transition-all",
                    appointmentMode === 'all'
                      ? "bg-white text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Tous les créneaux
                </button>
              </div>

              {/* Mode Premières disponibilités */}
              {appointmentMode === 'first' && (
                <div className="space-y-3">
                  {getFirstAvailableSlots().map((slot, index) => {
                    const isSelected = 
                      formData.preferredDate && 
                      isSameDay(slot.date, formData.preferredDate) && 
                      formData.preferredTimeSlot === slot.timeSlot.id;
                    
                    return (
                      <button
                        key={`${slot.date.toString()}-${slot.timeSlot.id}-${index}`}
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            preferredDate: slot.date,
                            preferredTimeSlot: slot.timeSlot.id
                          }));
                        }}
                        className={cn(
                          "w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between",
                          isSelected
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50 hover:bg-secondary/50"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <Clock className={cn(
                            "h-5 w-5",
                            isSelected ? "text-primary" : "text-muted-foreground"
                          )} />
                          <div className="text-left">
                            <div className={cn(
                              "font-semibold capitalize",
                              isSelected ? "text-primary" : "text-foreground"
                            )}>
                              {format(slot.date, "EEEE d MMMM yyyy", { locale: fr })}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {slot.timeSlot.label}
                            </div>
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="w-5 h-5 text-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Mode Tous les créneaux */}
              {appointmentMode === 'all' && (
                <>
                  <div className="space-y-4">
                    <Label>Sélectionnez une date</Label>
                    <div className="flex justify-center">
                      <Calendar
                        mode="single"
                        selected={formData.preferredDate || undefined}
                        onSelect={(date) => setFormData(prev => ({ ...prev, preferredDate: date || null }))}
                        locale={fr}
                        disabled={(date) => date < new Date() || date < new Date(new Date().setHours(0, 0, 0, 0))}
                        className="rounded-md border"
                      />
                    </div>
                  </div>

                  {formData.preferredDate && (
                    <div className="space-y-3">
                      <Label>Choisissez un créneau horaire</Label>
                      <div className="grid gap-3">
                        {timeSlots.map((slot) => (
                          <button
                            key={slot.id}
                            onClick={() => setFormData(prev => ({ ...prev, preferredTimeSlot: slot.id }))}
                            className={cn(
                              "flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left",
                              formData.preferredTimeSlot === slot.id
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-primary/50 hover:bg-secondary/50"
                            )}
                          >
                            <Clock className={cn(
                              "h-5 w-5",
                              formData.preferredTimeSlot === slot.id ? "text-primary" : "text-muted-foreground"
                            )} />
                            <div className="flex-1">
                              <div className={cn(
                                "font-medium",
                                formData.preferredTimeSlot === slot.id ? "text-primary" : "text-foreground"
                              )}>
                                {slot.label}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {format(formData.preferredDate ?? new Date(), "EEEE d MMMM yyyy", { locale: fr })}
                              </div>
                            </div>
                            {formData.preferredTimeSlot === slot.id && (
                              <Check className="w-5 h-5 text-primary" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Step 7: Prix estimé */}
          {step === 7 && (
            <div className="space-y-6">
              {/* Encadré du prix estimé */}
              <div className="bg-primary/10 border-2 border-primary rounded-xl p-8">
                <div className="text-center space-y-4">
                  <h4 className="text-lg font-semibold text-muted-foreground uppercase tracking-wide">Prix d'intervention estimé</h4>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-5xl font-bold text-primary">
                      {calculateEstimatedPrice(formData.serviceType, formData.serviceCategory, formData.serviceScope)} €
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Tarif indicatif basé sur votre demande. Le professionnel vous communiquera un devis précis après analyse de votre situation.
                  </p>
                </div>
              </div>

              {/* Récapitulatif de la demande avec cards */}
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">Votre demande :</h4>
                
                {/* Card pour le service */}
                <div className="bg-white border-2 border-primary/20 rounded-lg p-3 flex items-center gap-3">
                  {(() => {
                    const service = serviceTypes.find(s => s.id === formData.serviceType);
                    const Icon = service?.icon;
                    return (
                      <>
                        {Icon && <Icon className="w-5 h-5 text-primary" />}
                        <div>
                          <div className="text-xs text-muted-foreground">Service</div>
                          <div className="font-semibold text-foreground">{service?.label}</div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Cards pour les choix détaillés */}
                <div className="flex flex-wrap gap-2">
                  {formData.serviceCategory && (
                    <div className="inline-flex items-center px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
                      <span className="text-sm font-medium text-primary">
                        {getServiceQuestions()?.categories.find(c => c.id === formData.serviceCategory)?.label}
                      </span>
                    </div>
                  )}
                  {formData.serviceDetail && (
                    <div className="inline-flex items-center px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
                      <span className="text-sm font-medium text-primary">
                        {getDetailsForCategory().find(d => d.id === formData.serviceDetail)?.label}
                      </span>
                    </div>
                  )}
                  {formData.serviceScope && (
                    <div className="inline-flex items-center px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
                      <span className="text-sm font-medium text-primary">
                        {plumberieQuestions.scopes.find(s => s.id === formData.serviceScope)?.label}
                      </span>
                    </div>
                  )}
                </div>

                {/* Date souhaitée */}
                {formData.preferredDate && (
                  <div className="bg-white border-2 border-primary/20 rounded-lg p-3 flex items-center gap-3">
                    <Clock className="w-5 h-5 text-primary" />
                    <div>
                      <div className="text-xs text-muted-foreground">Date souhaitée</div>
                      <div className="font-semibold text-foreground capitalize">
                        {format(formData.preferredDate, "EEEE d MMMM yyyy", { locale: fr })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                <div className="text-blue-500 flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm text-blue-800">
                  Ce tarif est une estimation. Le prix final sera déterminé par le professionnel après évaluation complète de vos besoins.
                </p>
              </div>
            </div>
          )}

          {/* Step 8: Informations personnelles */}
          {step === 8 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input
                    id="firstName"
                    placeholder="Jean"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    placeholder="Dupont"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jean.dupont@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Numéro de téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="06 12 34 56 78"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>
          )}

          {/* Step 9: Adresse de l'intervention */}
          {step === 9 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="interventionAddress">
                  Adresse <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="interventionAddress"
                  placeholder="123 Rue de la République"
                  value={formData.interventionAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, interventionAddress: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="interventionAddressLine2">
                  Complément d'adresse
                </Label>
                <Input
                  id="interventionAddressLine2"
                  placeholder="Appartement 123, Bâtiment B"
                  value={formData.interventionAddressLine2}
                  onChange={(e) => setFormData(prev => ({ ...prev, interventionAddressLine2: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="interventionCity">
                    Ville <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="interventionCity"
                    placeholder="Paris"
                    value={formData.interventionCity}
                    onChange={(e) => setFormData(prev => ({ ...prev, interventionCity: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interventionPostalCode">
                    Code postal <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="interventionPostalCode"
                    placeholder="75001"
                    value={formData.interventionPostalCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 5);
                      setFormData(prev => ({ ...prev, interventionPostalCode: value }));
                    }}
                    maxLength={5}
                  />
                  {formData.interventionPostalCode && !(/^\d{5}$/.test(formData.interventionPostalCode)) && (
                    <p className="text-xs text-destructive">
                      Le code postal doit contenir 5 chiffres
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 10: Récapitulatif */}
          {step === 10 && (
            <div className="space-y-6">
              <div className="bg-secondary/30 rounded-lg p-4 space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">Localisation</h4>
                  <p className="font-medium">{formData.postalCode}</p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">Type de service</h4>
                  <p className="font-medium mb-2">
                    {serviceTypes.find(s => s.id === formData.serviceType)?.label}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.serviceCategory && (
                      <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                        <span className="text-sm font-medium text-primary">
                          {getServiceQuestions()?.categories.find(c => c.id === formData.serviceCategory)?.label}
                        </span>
                      </div>
                    )}
                    {formData.serviceDetail && (
                      <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                        <span className="text-sm font-medium text-primary">
                          {getDetailsForCategory().find(d => d.id === formData.serviceDetail)?.label}
                        </span>
                      </div>
                    )}
                    {formData.serviceScope && (
                      <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                        <span className="text-sm font-medium text-primary">
                          {plumberieQuestions.scopes.find(s => s.id === formData.serviceScope)?.label}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {formData.photos.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">Photos</h4>
                    <div className="flex gap-2 flex-wrap">
                      {formData.photos.map((photo, index) => (
                        <img
                          key={index}
                          src={URL.createObjectURL(photo)}
                          alt={`Photo ${index + 1}`}
                          className="w-20 h-20 object-cover rounded"
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">Description</h4>
                  <p className="text-sm">{formData.description}</p>
                </div>

                {formData.preferredDate && formData.preferredTimeSlot && (
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">Créneau souhaité</h4>
                    <p className="font-medium">
                      {format(formData.preferredDate, "EEEE d MMMM yyyy", { locale: fr })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {timeSlots.find(s => s.id === formData.preferredTimeSlot)?.label}
                    </p>
                  </div>
                )}
              </div>

              {/* Prix estimé calculé automatiquement */}
              <div className="bg-primary/10 border-2 border-primary rounded-xl p-6">
                <div className="text-center space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Prix d'intervention estimé</h4>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-4xl font-bold text-primary">
                      {calculateEstimatedPrice(formData.serviceType, formData.serviceCategory, formData.serviceScope)} €
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Tarif indicatif basé sur votre demande. Le professionnel vous communiquera un devis précis.
                  </p>
                </div>
              </div>

              <div className="bg-secondary/30 rounded-lg p-4 space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">Vos informations</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Nom:</span> {formData.firstName} {formData.lastName}</p>
                    <p><span className="font-medium">Email:</span> {formData.email}</p>
                    <p><span className="font-medium">Téléphone:</span> {formData.phone}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">Adresse de l'intervention</h4>
                  <div className="space-y-1 text-sm">
                    <p>{formData.interventionAddress}</p>
                    {formData.interventionAddressLine2 && (
                      <p className="text-muted-foreground">{formData.interventionAddressLine2}</p>
                    )}
                    <p>{formData.interventionPostalCode} {formData.interventionCity}</p>
                  </div>
                </div>
              </div>

              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <p className="text-sm text-center">
                  En confirmant, vous acceptez d'être contacté par des professionnels correspondant à votre demande.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Navigation buttons */}
        <div className="flex gap-3 pt-4 border-t">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={handlePrevious}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Précédent
            </Button>
          )}

          {step < 10 ? (
            <Button
              onClick={handleNext}
              disabled={!isStepValid()}
              className="ml-auto gap-2"
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!isStepValid()}
              className="ml-auto gap-2"
            >
              <Check className="h-4 w-4" />
              Confirmer la demande
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
