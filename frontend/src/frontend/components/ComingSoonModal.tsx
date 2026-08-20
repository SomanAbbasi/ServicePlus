import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/frontend/components/ui/dialog";
import { Button } from "@/frontend/components/ui/button";
import { useLocale } from "@/frontend/lib/locale";

export function ComingSoonModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useLocale();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("home.appComingSoon")}</DialogTitle>
          <DialogDescription>{t("home.appComingSoonBody")}</DialogDescription>
        </DialogHeader>
        <Button onClick={() => onOpenChange(false)} className="w-full">
          OK
        </Button>
      </DialogContent>
    </Dialog>
  );
}
