import ReceiptIcon from '@/assets/icons/InvoicesIcon';
import { useAuth } from '@/context/auth';
import { PaymentData } from '@/types/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Feather from '@expo/vector-icons/Feather';
import { Asset } from 'expo-asset';
import Constants from 'expo-constants';
import { SaveFormat, useImageManipulator } from 'expo-image-manipulator';
import { printAsync, printToFileAsync } from 'expo-print';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useMemo, useState } from 'react';
import { Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const IMAGE = Asset.fromModule(require('@/assets/images/LogoAlfayOmega.png'))

const InvoicesDetails = () => {
  const { item } = useLocalSearchParams<{ item?: string | string[] }>();
  const { user } = useAuth();
  const [printing, setPrinting] = useState(false);

  const invoiceDetails = useMemo<PaymentData | null>(() => {
    const raw = Array.isArray(item) ? item[0] : item;
    if (!raw) return null;
    try {
      return JSON.parse(raw) as PaymentData;
    } catch (e) {
      console.error('No se pudo parsear el parámetro item:', e);
      return null;
    }
  }, [item]);

  const formatMoney = (value: number | string | null | undefined) => {
    const num = typeof value === 'string' ? Number(value) : value ?? 0;
    const safe = isNaN(Number(num)) ? 0 : Number(num);
    return safe.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const context = useImageManipulator(IMAGE.uri);

  if (!invoiceDetails) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <Text>No se encontró el recibo.</Text>
      </SafeAreaView>
    );
  }

  async function generateAndPrint() {
    try {
      if (!invoiceDetails) return;
      if (printing) return;
      setPrinting(true);

      await IMAGE.downloadAsync();
      const manipulatedImage = await context.renderAsync();
      const result = await manipulatedImage.saveAsync({ base64: true, format: SaveFormat.PNG, compress: 0.7 });
      const logo = `data:image/png;base64,${result.base64}`;

      const folio = `${invoiceDetails.docEntry ?? ''}`;
      const dateStr = invoiceDetails.docDate
        ? new Date(invoiceDetails.docDate).toLocaleString()
        : '';

      const pay = invoiceDetails.payment?.[0] ?? ({} as any);
      let paymentExtra = '';
      if (invoiceDetails.paymentMeans === 'Tarjeta') {
        paymentExtra = `<div class="row"><span>Referencia</span><span>${pay.cardVoucherNum ?? 'N/D'}</span></div>`;
      } else if (invoiceDetails.paymentMeans === 'Cheque') {
        paymentExtra = `
          <div class="row"><span>Banco</span><span>${pay.bankCode ?? 'N/D'}</span></div>
          <div class="row"><span>N° Cheque</span><span>${pay.checkNumber ?? 'N/D'}</span></div>
          <div class="row"><span>Fecha Cheque</span><span>${pay.dueDate ?? 'N/D'}</span></div>
        `;
      } else if (invoiceDetails.paymentMeans === 'Transferencia') {
        paymentExtra = `
          <div class="row"><span>Fecha</span><span>${pay.transferDate ?? 'N/D'}</span></div>
          <div class="row"><span>Referencia</span><span>${pay.transferReference ?? 'N/D'}</span></div>
          <div class="row"><span>Cuenta</span><span>${pay.transferAccountName ?? 'N/D'}</span></div>
        `;
      }

      // Función para formatear fechas en formato YYYY-MM-DD
      const formatDate = (date: any) => {
        if (!date) return 'N/D';
        const d = new Date(date);
        return isNaN(d.getTime()) ? 'N/D' : d.toISOString().split('T')[0];
      };

      // Modificación de la tabla de facturas
      const facturasHTML = `
        <div class="table-header">
          <span class="col-date">FECHA</span>
          <span class="col-invoice">FACTURA</span>
          <span class="col-balance">SALDO ANT.</span>
          <span class="col-payment">ABONO</span>
        </div>
        ${invoiceDetails.invoices.map((inv) => {
        const abono = formatMoney(inv.appliedAmount);
        const saldoAnt = formatMoney(inv.saldoAnterior);

        const fecha = inv.invoiceDate ? formatDate(inv.invoiceDate) : 'N/D';

        return `
            <div class="table-row">
              <span class="col-date">${fecha}</span>
              <span class="col-invoice">${inv.numAtCard ?? 'N/D'}</span>
              <span class="col-balance">L. ${saldoAnt}</span>
              <span class="col-payment">L. ${abono}</span>
            </div>
          `;
      }).join('')}
      `;

      // Calcular el saldo pendiente sumando todos los pendientes de las facturas
      const totalPendiente = invoiceDetails.invoices.reduce(
        (acc, inv) => acc + (Number(inv.pendiente) || 0),
        0
      );

      const html = `
        <html>
          <head>
        <meta charset="utf-8" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Montserrat:wght@600&display=swap" rel="stylesheet">
        <style>
          @page { size: 80mm auto; margin: 4px 4px 8px; }
          * { box-sizing: border-box; }
          body {
            font-family: 'Inter', sans-serif;
            background: #fff;
            margin: 0;
            padding: 0;
            font-size: 10px;
            color: #000;
          }
          .ticket {
            width: 80mm;
            height: auto;
            // padding: 8px 8px 12px;
            margin: 0 auto;
          }
          img {
            max-width: 80%;
            margin: 12px auto 12px;
            display: block;
            background: white;
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
          /* Estilos para la tabla */
          .table-header {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
            margin-bottom: 5px;
            border-bottom: 1px dashed #000;
            padding-bottom: 3px;
          }
          .table-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
          }
          .col-date { width: 25%; }
          .col-invoice { width: 25%; }
          .col-balance { width: 25%; text-align: right; }
          .col-payment { width: 25%; text-align: right; }
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
            <div class="row"><span class="bold">Cliente</span><span>${invoiceDetails.cardCode} - ${invoiceDetails.cardName}</span></div>
            <div class="row"><span class="bold">Vendedor</span><span>${user?.fullName ?? ''}</span></div>
            <div class="row"><span class="bold">Fecha</span><span>${dateStr}</span></div>
          </div>
          <div class="divider"></div>
          <div class="center section-title">Recibo de Cobros</div>
          <div class="divider"></div>
          <div class="section-title">Facturas</div>
          ${facturasHTML}
          <div class="divider"></div>
          <div class="section-title">Pago</div>
          <div class="row"><span>Método</span><span>${invoiceDetails.paymentMeans}</span></div>
          ${paymentExtra}
          <div class="row bold"><span>Total pagado</span><span>L. ${formatMoney(invoiceDetails.total)}</span></div>
          <div class="divider"></div>
          <div class="row bold"><span>Saldo pendiente</span><span>L. ${formatMoney(totalPendiente)}</span></div>
          <div class="divider"></div>
          <div class="foot">
            ¡Gracias por su pago!<br/>
            Dudas o reclamos por inconsistencias con su saldo,<br/> llamar al 9458-7168
          </div>
        </div>
          </body>
        </html>
      `;
      // Primero generamos el PDF localmente (más confiable en producción / standalone)
      const pdf = await printToFileAsync({ html, base64: false });

      // Intentamos abrir el diálogo de impresión (iOS admite uri directa; en Android usamos nuevamente html si uri falla)
      try {
        if (Platform.OS === 'ios') {
          await printAsync({ uri: pdf.uri });
        } else {
          // Algunos servicios de impresión en Android no aceptan uri, reutilizamos html
          await printAsync({ html });
        }
      } catch (printErr) {
        console.warn('Fallo al abrir diálogo de impresión, se intentará compartir el PDF:', printErr);
      }

      // Ofrecemos compartir/guardar el PDF si es posible
      try {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(pdf.uri, {
            UTI: 'com.adobe.pdf',
            mimeType: 'application/pdf',
            dialogTitle: 'Compartir recibo'
          });
        }
      } catch (shareErr) {
        console.warn('No se pudo compartir el PDF:', shareErr);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setPrinting(false);
    }
  }

  return (
    <SafeAreaView className="bg-white flex-1" style={{ paddingTop: -Constants.statusBarHeight }}>
      <ScrollView style={{ paddingHorizontal: 16, position: 'relative' }} showsVerticalScrollIndicator={false}>
        <View className='flex-row justify-between items-center w-full'>
          <Text className="text-xl font-[Poppins-SemiBold] mt-4 mb-2">Cliente</Text>

          <TouchableOpacity
            onPress={() => {
              router.push({ pathname: '/previewInvoice', params: { item: Array.isArray(item) ? item[0] : item } });
            }}
            className="z-50"
          >
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

            {invoiceDetails.paymentMeans === "Tarjeta" && invoiceDetails.payment?.[0] && (
              <View className="flex-row justify-between items-center mb-2 p-3 bg-gray-100 rounded-lg">
                <View className="flex-row items-center gap-2">
                  <Text className="text-base font-[Poppins-Regular] text-gray-700">Referencia</Text>
                </View>
                <Text className="text-base font-[Poppins-SemiBold] text-gray-800">{invoiceDetails.payment?.[0]?.cardVoucherNum || 'N/D'}</Text>
              </View>
            )}

            {invoiceDetails.paymentMeans === "Cheque" && invoiceDetails.payment?.[0] && (
              <View className="items-center gap-2 mb-2">
                <View className='w-full gap-2 h-fit flex-row'>
                  <View className="flex-1 items-start gap-2 p-3 rounded-lg bg-gray-100">
                    <Text className="text-sm font-[Poppins-Regular] leading-3 text-gray-700">Banco</Text>
                    <Text className="text-base font-[Poppins-SemiBold] leading-3 text-gray-800">{invoiceDetails.payment?.[0]?.bankCode || 'N/D'}</Text>
                  </View>

                  <View className="flex-1 items-start gap-2 p-3 rounded-lg bg-gray-100">
                    <Text className="text-sm font-[Poppins-Regular] leading-3 text-gray-700">Numero de Cheque</Text>
                    <Text className="text-base font-[Poppins-SemiBold] leading-3 text-gray-800">{invoiceDetails.payment?.[0]?.checkNumber || 'N/D'}</Text>
                  </View>
                </View>

                <View className="flex-1 w-full items-start gap-2 p-3 rounded-lg bg-gray-100">
                  <Text className="text-sm font-[Poppins-Regular] leading-3 text-gray-700">Fecha del Cheque</Text>
                  <Text className="text-base font-[Poppins-SemiBold] leading-3 text-gray-800">{invoiceDetails.payment?.[0]?.dueDate || 'N/D'}</Text>
                </View>
              </View>
            )}

            {invoiceDetails.paymentMeans === "Transferencia" && invoiceDetails.payment?.[0] && (
              <View className="items-center gap-2 mb-2">
                <View className="flex-1 w-full items-start justify-center gap-2 p-3 rounded-lg bg-gray-100">
                  <Text className="text-sm font-[Poppins-Regular] leading-3 text-gray-700">Fecha de la Transferencia</Text>
                  <Text className="text-base font-[Poppins-SemiBold] leading-3 text-gray-800">{invoiceDetails.payment?.[0]?.transferDate || 'N/D'}</Text>
                </View>

                <View className="flex-1 w-full items-start justify-center gap-2 p-3 rounded-lg bg-gray-100">
                  <Text className="text-sm font-[Poppins-Regular] leading-3 text-gray-700">Referencia</Text>
                  <Text className="text-base font-[Poppins-SemiBold] leading-3 text-gray-800">{invoiceDetails.payment?.[0]?.transferReference || 'N/D'}</Text>
                </View>

                <View className="flex-1 w-full items-start justify-center p-3 rounded-lg bg-gray-100">
                  <Text className="text-sm font-[Poppins-Regular] text-gray-700">Cuenta</Text>
                  <Text className="text-base font-[Poppins-SemiBold] text-gray-800">{invoiceDetails.payment?.[0]?.transferAccountName || "No disponible"}</Text>
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