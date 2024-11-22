import { addProviderKey, getProviderKeys } from "@/app/services/hydra.service";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { ProjectResponseDto, ProviderKeyResponseDto } from "../../../app/dashboard/types/types";

interface ProviderKeySectionProps {
  project: ProjectResponseDto;
}

export function ProviderKeySection({ project }: ProviderKeySectionProps) {
  const [isEditingProviderKey, setIsEditingProviderKey] = useState(false);
  const [providerKey, setProviderKey] = useState('');
  const [providerKeys, setProviderKeys] = useState<ProviderKeyResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadProviderKeys = async () => {
    try {
      setIsLoading(true);
      const keys = await getProviderKeys(project.id);
      setProviderKeys(keys);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load provider keys",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProviderKeys();
  }, [project.id, loadProviderKeys]);

  const handleUpdateProviderKey = async () => {
    try {
      await addProviderKey(project.id, "openai", providerKey);
      await loadProviderKeys();
      setIsEditingProviderKey(false);
      toast({
        title: "Success",
        description: "Provider key updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update provider key",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-sm font-semibold">OpenAI API Key</h4>
        {isEditingProviderKey ? (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleUpdateProviderKey}
            >
              Save
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setIsEditingProviderKey(false);
              }}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditingProviderKey(true)}
          >
            Edit
          </Button>
        )}
      </div>
      {isEditingProviderKey ? (
        <input
          type="text"
          value={providerKey}
          onChange={(e) => setProviderKey(e.target.value)}
          className="w-full px-2 py-1 text-sm border rounded"
          placeholder="Enter OpenAI API Key"
          autoFocus
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          {isLoading ? 'Loading...' : (
            providerKeys.length > 0
              ? (providerKeys[providerKeys.length - 1].partiallyHiddenKey
                ? providerKeys[providerKeys.length - 1].partiallyHiddenKey.slice(0, 15)
                : `${providerKeys[providerKeys.length - 1].providerKeyEncrypted.slice(0, 15)}...`)
              : 'No provider key set'
          )}
        </p>
      )}
    </div>

  );
} 