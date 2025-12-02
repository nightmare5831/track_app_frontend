import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Language = 'en' | 'pt';

interface Translations {
  [key: string]: {
    en: string;
    pt: string;
  };
}

const translations: Translations = {
  // App general
  'app.name': { en: 'Hand Mine Control', pt: 'Controle de Mineração' },
  'app.welcome': { en: 'Welcome', pt: 'Bem-vindo' },

  // Auth
  'auth.login': { en: 'Login', pt: 'Entrar' },
  'auth.logout': { en: 'Logout', pt: 'Sair' },
  'auth.email': { en: 'Email', pt: 'E-mail' },
  'auth.password': { en: 'Password', pt: 'Senha' },
  'auth.register': { en: 'Register', pt: 'Registrar' },

  // Navigation
  'nav.home': { en: 'Home', pt: 'Início' },
  'nav.equipment': { en: 'Equipment', pt: 'Equipamento' },
  'nav.operation': { en: 'Operation', pt: 'Operação' },
  'nav.reports': { en: 'Reports', pt: 'Relatórios' },
  'nav.admin': { en: 'Admin', pt: 'Administrador' },

  // Equipment
  'equipment.select': { en: 'Select Equipment', pt: 'Selecionar Equipamento' },
  'equipment.loading': { en: 'Loading Equipment', pt: 'Equipamento de Carregamento' },
  'equipment.transport': { en: 'Transport Equipment', pt: 'Equipamento de Transporte' },
  'equipment.all': { en: 'All', pt: 'Todos' },
  'equipment.name': { en: 'Equipment Name', pt: 'Nome do Equipamento' },
  'equipment.category': { en: 'Category', pt: 'Categoria' },
  'equipment.capacity': { en: 'Capacity', pt: 'Capacidade' },
  'equipment.status': { en: 'Status', pt: 'Estado' },
  'equipment.active': { en: 'Active', pt: 'Ativo' },
  'equipment.inactive': { en: 'Inactive', pt: 'Inativo' },
  'equipment.maintenance': { en: 'Maintenance', pt: 'Manutenção' },

  // Operations
  'operation.start': { en: 'Start Operation', pt: 'Iniciar Operação' },
  'operation.stop': { en: 'Stop Operation', pt: 'Parar Operação' },
  'operation.edit': { en: 'Edit Operation', pt: 'Editar Operação' },
  'operation.current': { en: 'Current Activity', pt: 'Atividade Atual' },
  'operation.recent': { en: 'Recent Activities', pt: 'Atividades Recentes' },
  'operation.activity': { en: 'Activity', pt: 'Atividade' },
  'operation.material': { en: 'Material', pt: 'Material' },
  'operation.truck': { en: 'Truck', pt: 'Caminhão' },
  'operation.miningFront': { en: 'Mining Front', pt: 'Frente de Lavra' },
  'operation.destination': { en: 'Destination', pt: 'Destino' },
  'operation.details': { en: 'Details', pt: 'Detalhes' },
  'operation.add': { en: 'Add Operation', pt: 'Adicionar Operação' },

  // Admin
  'admin.dashboard': { en: 'Admin Dashboard', pt: 'Painel Administrativo' },
  'admin.operators': { en: 'Operators', pt: 'Operadores' },
  'admin.activities': { en: 'Activity Types', pt: 'Tipos de Atividade' },
  'admin.equipment': { en: 'Equipment Management', pt: 'Gestão de Equipamento' },
  'admin.activeOps': { en: 'Active', pt: 'Ativo' },
  'admin.alerts': { en: 'Alerts', pt: 'Alertas' },
  'admin.working': { en: 'Working', pt: 'Trabalhando' },
  'admin.idle': { en: 'Idle', pt: 'Parado' },

  // Reports
  'reports.title': { en: 'Reports', pt: 'Relatórios' },
  'reports.export': { en: 'Export', pt: 'Exportar' },
  'reports.daily': { en: 'Daily Summary', pt: 'Resumo Diário' },
  'reports.performance': { en: 'Performance Overview', pt: 'Visão de Desempenho' },
  'reports.selectDate': { en: 'Select Date', pt: 'Selecionar Data' },

  // Common
  'common.save': { en: 'Save', pt: 'Salvar' },
  'common.cancel': { en: 'Cancel', pt: 'Cancelar' },
  'common.delete': { en: 'Delete', pt: 'Excluir' },
  'common.edit': { en: 'Edit', pt: 'Editar' },
  'common.add': { en: 'Add', pt: 'Adicionar' },
  'common.search': { en: 'Search', pt: 'Buscar' },
  'common.loading': { en: 'Loading...', pt: 'Carregando...' },
  'common.success': { en: 'Success', pt: 'Sucesso' },
  'common.error': { en: 'Error', pt: 'Erro' },
  'common.confirm': { en: 'Confirm', pt: 'Confirmar' },

  // Messages
  'msg.noData': { en: 'No data available', pt: 'Nenhum dado disponível' },
  'msg.noOperations': { en: 'No operations yet', pt: 'Ainda não há operações' },
  'msg.operationStarted': { en: 'Operation started', pt: 'Operação iniciada' },
  'msg.operationStopped': { en: 'Operation stopped', pt: 'Operação parada' },
  'msg.operationUpdated': { en: 'Operation updated', pt: 'Operação atualizada' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLang = await AsyncStorage.getItem('app_language');
      if (savedLang === 'en' || savedLang === 'pt') {
        setLanguageState(savedLang);
      }
    } catch (error) {
      console.error('Error loading language:', error);
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      await AsyncStorage.setItem('app_language', lang);
      setLanguageState(lang);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
