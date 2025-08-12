import ReceiptIcon from '@/assets/icons/InvoicesIcon';
import { useAuth } from '@/context/auth';
import { useAppStore } from '@/state';
import { PaymentData } from '@/types/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Feather from '@expo/vector-icons/Feather';
import axios from 'axios';
import { Asset } from 'expo-asset';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const InvoicesDetails = () => {
  const { docEntry } = useLocalSearchParams();
  const [invoiceDetails, setInvoiceDetails] = useState<PaymentData | null>(null);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { fetchUrl } = useAppStore();
  const { user } = useAuth();

  const formatMoney = (value: number | string | null | undefined) => {
    const num = typeof value === 'string' ? Number(value) : value ?? 0;
    const safe = isNaN(Number(num)) ? 0 : Number(num);
    return safe.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  useEffect(() => {
    const loadLogo = async () => {
      const asset = Asset.fromModule(require('@/assets/images/LogoAlfayOmega.png'));
      await asset.downloadAsync();
      const base64 = await FileSystem.readAsStringAsync(asset.localUri!, {
        encoding: FileSystem.EncodingType.Base64,
      });
      setLogoBase64(`data:image/png;base64,${base64}`);
    };

    loadLogo();
  }, []);

  // ✅ Obtener detalles del pago
  useEffect(() => {
    const fetchDetails = async () => {
      if (!docEntry) return;

      try {
        const response = await axios.get<PaymentData>(`${fetchUrl}/api/Payments/${docEntry}`);
        setInvoiceDetails(response.data);
        console.log(response.data);
      } catch (error) {
        console.error('Error al obtener el recibo:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [docEntry]);

  const buildTicketHTML = (invoice: PaymentData, logo: string) => {
    const folio = Array.isArray(docEntry)
      ? docEntry[0]
      : typeof docEntry === 'string'
        ? docEntry
        : '';
    const dateStr = invoice.docDate
      ? new Date(invoice.docDate).toLocaleString()
      : '';

    // Detalles según medio de pago
    const pay = invoice.payment?.[0] ?? ({} as any);
    let paymentExtra = '';
    if (invoice.paymentMeans === 'Tarjeta') {
      paymentExtra = `<div class="row"><span>Referencia</span><span>${pay.cardVoucherNum ?? 'N/D'}</span></div>`;
    } else if (invoice.paymentMeans === 'Cheque') {
      paymentExtra = `
        <div class="row"><span>Banco</span><span>${pay.bankCode ?? 'N/D'}</span></div>
        <div class="row"><span>N° Cheque</span><span>${pay.checkNumber ?? 'N/D'}</span></div>
        <div class="row"><span>Fecha Cheque</span><span>${pay.dueDate ?? 'N/D'}</span></div>
      `;
    } else if (invoice.paymentMeans === 'Transferencia') {
      paymentExtra = `
        <div class="row"><span>Fecha</span><span>${pay.transferDate ?? 'N/D'}</span></div>
        <div class="row"><span>Referencia</span><span>${pay.transferReference ?? 'N/D'}</span></div>
        <div class="row"><span>Cuenta</span><span>${pay.transferAccountName ?? 'N/D'}</span></div>
      `;
    }

    const facturasHTML = invoice.invoices
      .map((inv) => {
        const total = formatMoney(inv.docTotal);
        const abono = formatMoney(inv.appliedAmount);
        const saldoAnt = formatMoney(inv.saldoAnterior);
        const saldoPend = formatMoney(inv.pendiente);

        const fecha = inv.invoiceDate
          ? (() => {
            const d = new Date(inv.invoiceDate);
            return isNaN(d.getTime()) ? 'N/D' : d.toLocaleDateString();
          })()
          : 'N/D';
        return `
          <div class="row"><span>Factura</span><span>${inv.numAtCard ?? 'N/D'}</span></div>
          <div class="row"><span>Fecha</span><span>${fecha}</span></div>
          <div class="row"><span>Total</span><span>L. ${total}</span></div>
        <div class="row"><span>Saldo Ant.</span><span>L. ${saldoAnt}</span></div>
        <div class="row"><span>Abono</span><span>L. ${abono}</span></div>
        <div class="row"><span>Saldo Pend.</span><span>L. ${saldoPend}</span></div>
        <hr/>
            `;
      })
      .join('');

    return `
    <html>
      <head>
        <meta charset="utf-8" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Montserrat:wght@600&display=swap" rel="stylesheet">
        <style>
          @page { size: 80mm auto; margin: 0; }
          * { box-sizing: border-box; }
          body {
            font-family: 'Inter', sans-serif;
            background: #fff;
            margin: 0;
            padding: 0;
            font-size: 12px;
            color: #000;
          }
          .ticket {
            width: 80mm;
            height: auto;
            padding: 8px 8px 12px;
            margin: 0 auto;
          }
          img {
            max-width: 80%;
            margin: 12px auto 12px;
            display: block;
          }
          .center { text-align: center; }
          .start { text-align: left; width: 100%; margin-top: 8px; }
          .bold { font-weight: 600; }
          .muted { color: #555; }
          .row { display: flex; justify-content: space-between; gap: 8px; }
          .section-title {
            font-family: 'Montserrat', sans-serif;
            font-weight: 600;
            margin: 8px 0 4px;
            text-transform: uppercase;
          }
          .divider {
            height: 1px;
            background: #000;
            opacity: 0.2;
            margin: 8px 0;
          }
          hr {
            border: none;
            border-top: 1px dashed #000;
            margin: 6px 0;
          }
          .foot {
            margin-top: 30px;
            text-align: center;
            font-size: 11px;
            color: #444;
          }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="center">
            <img src="${logo}" />
            <div class="bold" style="font-family:'Montserrat', sans-serif; font-size:18px; margin-bottom: 34px;">Grupo Alfa & Omega</div>
          </div>
          <div class="start">
            <div class="row"><span class="bold">Folio</span><span>${folio || 'N/D'}</span></div>
            <div class="row"><span class="bold">Cliente</span><span>${invoice.cardCode} - ${invoice.cardName}</span></div>
            <div class="row"><span class="bold">Vendedor</span><span>${user?.fullName ?? ''}</span></div>
            <div class="row"><span class="bold">Fecha</span><span>${dateStr}</span></div>
          </div>
          <div class="divider"></div>
          <div class="center section-title">Recibo de Cobros</div>
          <div class="divider"></div>
          <div class="section-title">Facturas</div>
          ${facturasHTML}
          <div class="section-title">Pago</div>
          <div class="row"><span>Método</span><span>${invoice.paymentMeans}</span></div>
          ${paymentExtra}
          <div class="row bold"><span>Total pagado</span><span>L. ${formatMoney(invoice.total)}</span></div>
          <div class="divider"></div>
          <div class="foot">
            ¡Gracias por su pago!<br/>
            Dudas o reclamos por inconsistencias con su saldo,<br/> llamar al 9458-7168
          </div>
        </div>
      </body>
    </html>
  `;
  };

  const handlePrint = async () => {
    if (!invoiceDetails || !logoBase64) return;
    const html = buildTicketHTML(invoiceDetails, logoBase64);
    try {
      await Print.printAsync({ html });
    } catch (error) {
      console.error('Error al imprimir:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#000" />
      </SafeAreaView>
    );
  }

  if (!invoiceDetails) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <Text>No se encontró el recibo.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="bg-white flex-1" style={{ paddingTop: -Constants.statusBarHeight }}>
      <ScrollView style={{ paddingHorizontal: 16, position: 'relative' }} showsVerticalScrollIndicator={false}>
        {/* Cliente */}
        <View className='flex-row justify-between items-center w-full'>
          <Text className="text-xl font-[Poppins-SemiBold] mt-4 mb-2">Cliente</Text>

          <TouchableOpacity onPress={handlePrint} className="z-50">
            <Feather name="printer" size={28} color="black" />
          </TouchableOpacity>
        </View>

        <View className="flex-row gap-4 mb-4 items-center">
          <View className="bg-yellow-300 rounded-full items-center justify-center h-[50px] w-[50px]">
            <MaterialCommunityIcons name="account-circle" size={30} color="#000" />
          </View>
          <View>
            <Text className="font-[Poppins-SemiBold] tracking-[-0.3px] leading-5">{invoiceDetails.cardName}</Text>
            <Text className="font-[Poppins-Medium] tracking-[-0.3px] leading-5">{invoiceDetails.cardCode}</Text>
            <Text className="font-[Poppins-Medium] tracking-[-0.3px] leading-5">{invoiceDetails.docEntry}</Text>
          </View>
        </View>

        {/* Facturas Abonadas */}
        <Text className="text-xl font-[Poppins-SemiBold] mb-2">Facturas Abonadas</Text>
        {invoiceDetails.invoices.map((inv) => (
          <View
            key={inv.numAtCard ?? inv.invoiceDocNum}
            className="flex-row items-start gap-4 bg-gray-100 p-4 rounded-xl mb-3"
          >
            <View className="bg-yellow-300 p-2 rounded-xl">
              <ReceiptIcon />
            </View>

            <View className="flex-1">
              <View className="flex-row justify-between items-center mb-1">
                <View>
                  <Text className="font-[Poppins-SemiBold] text-base tracking-[-0.3px]">
                    Factura Nº: {inv.numAtCard ?? inv.invoiceDocNum}
                  </Text>
                  <Text className="font-[Poppins-Regular] text-gray-500 text-xs tracking-[-0.3px]">
                    Total: L. {formatMoney(inv.docTotal)}
                  </Text>
                  <Text className="font-[Poppins-Regular] text-gray-500 text-xs tracking-[-0.3px]">
                    Saldo Anterior: L. {formatMoney(inv.saldoAnterior)}
                  </Text>
                  <Text className="font-[Poppins-Regular] text-red-500 text-xs tracking-[-0.3px]">
                    Abono: L. {formatMoney(inv.appliedAmount ?? 0)}
                  </Text>
                  <Text className="font-[Poppins-Regular] text-gray-500 text-xs tracking-[-0.3px]">
                    Saldo Pendiente: L. {formatMoney(inv.pendiente)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ))}

        {/* Información de Pago */}
        <Text className="text-xl font-[Poppins-SemiBold] mt-4 mb-2">Información de Pago</Text>
        <View className="bg-white rounded-2xl h-fit overflow-hidden border border-gray-200 shadow-sm">
          <View className="bg-yellow-300 p-2">
            <Text className="text-xl font-[Poppins-Bold] text-gray-800 text-center">Detalles del Pago</Text>
          </View>

          <View className="p-4">
            <View className="flex-row justify-between items-center mb-2 p-3 bg-gray-100 rounded-lg">
              <Text className="text-base font-[Poppins-Regular] text-gray-700">Medio de Pago</Text>
              <Text className="text-base font-[Poppins-SemiBold] text-gray-800">{invoiceDetails.paymentMeans}</Text>
            </View>

            {invoiceDetails.paymentMeans === "Tarjeta" && (
              <View className="flex-row justify-between items-center mb-2 p-3 bg-gray-100 rounded-lg">
                <View className="flex-row items-center gap-2">
                  <Text className="text-base font-[Poppins-Regular] text-gray-700">Referencia</Text>
                </View>
                <Text className="text-base font-[Poppins-SemiBold] text-gray-800">{invoiceDetails.payment[0].cardVoucherNum}</Text>
              </View>
            )}

            {invoiceDetails.paymentMeans === "Cheque" && (
              <View className="items-center gap-2 mb-2">
                <View className='w-full gap-2 h-fit flex-row'>
                  <View className="flex-1 items-start gap-2 p-3 rounded-lg bg-gray-100">
                    <Text className="text-sm font-[Poppins-Regular] leading-3 text-gray-700">Banco</Text>
                    <Text className="text-base font-[Poppins-SemiBold] leading-3 text-gray-800">{invoiceDetails.payment[0].bankCode}</Text>
                  </View>

                  <View className="flex-1 items-start gap-2 p-3 rounded-lg bg-gray-100">
                    <Text className="text-sm font-[Poppins-Regular] leading-3 text-gray-700">Numero de Cheque</Text>
                    <Text className="text-base font-[Poppins-SemiBold] leading-3 text-gray-800">{invoiceDetails.payment[0].checkNumber}</Text>
                  </View>
                </View>

                <View className="flex-1 w-full items-start gap-2 p-3 rounded-lg bg-gray-100">
                  <Text className="text-sm font-[Poppins-Regular] leading-3 text-gray-700">Fecha del Cheque</Text>
                  <Text className="text-base font-[Poppins-SemiBold] leading-3 text-gray-800">{invoiceDetails.payment[0].dueDate}</Text>
                </View>
              </View>
            )}

            {invoiceDetails.paymentMeans === "Transferencia" && (
              <View className="items-center gap-2 mb-2">
                <View className="flex-1 w-full items-start justify-center gap-2 p-3 rounded-lg bg-gray-100">
                  <Text className="text-sm font-[Poppins-Regular] leading-3 text-gray-700">Fecha de la Transferencia</Text>
                  <Text className="text-base font-[Poppins-SemiBold] leading-3 text-gray-800">{invoiceDetails.payment[0].transferDate}</Text>
                </View>

                <View className="flex-1 w-full items-start justify-center gap-2 p-3 rounded-lg bg-gray-100">
                  <Text className="text-sm font-[Poppins-Regular] leading-3 text-gray-700">Referencia</Text>
                  <Text className="text-base font-[Poppins-SemiBold] leading-3 text-gray-800">{invoiceDetails.payment[0].transferReference}</Text>
                </View>

                <View className="flex-1 w-full items-start justify-center p-3 rounded-lg bg-gray-100">
                  <Text className="text-sm font-[Poppins-Regular] text-gray-700">Cuenta</Text>
                  <Text className="text-base font-[Poppins-SemiBold] text-gray-800">{invoiceDetails.payment[0].transferAccountName || "No disponible"}</Text>
                </View>
              </View>
            )}

            <View className="flex-row justify-between items-center mb-2 p-3 bg-gray-100 rounded-lg">
              <Text className="text-base font-[Poppins-Regular] text-gray-700">Total</Text>
              <Text className="text-base font-[Poppins-SemiBold] text-gray-800">L. {formatMoney(invoiceDetails.total)}</Text>
            </View>

            <View className="flex-row justify-between items-center p-3 bg-gray-100 rounded-lg">
              <Text className="text-base font-[Poppins-Regular] text-gray-700">Fecha</Text>
              <Text className="text-base font-[Poppins-SemiBold] text-gray-800">
                {new Date(invoiceDetails.docDate).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-row justify-between border-b border-b-gray-300 border-dashed mt-10">
          <Text className="font-[Poppins-SemiBold] text-xl tracking-[-0.4px]">Total</Text>
          <Text className="font-[Poppins-SemiBold] text-xl tracking-[-0.4px]">L. {formatMoney(invoiceDetails.total)}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default InvoicesDetails;