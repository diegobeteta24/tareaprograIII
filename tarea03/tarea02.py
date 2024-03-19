import os
import graphviz

class Nodo:
    def __init__(self, valor):
        self.valor = valor
        self.izquierda = None
        self.derecha = None

class ArbolBinarioBusqueda:
    def __init__(self):
        self.raiz = None

    def insertar(self, valor):
        self.raiz = self._insertar_recursivo(self.raiz, valor)

    def _insertar_recursivo(self, raiz, valor):
        if raiz is None:
            return Nodo(valor)
        if valor < raiz.valor:
            raiz.izquierda = self._insertar_recursivo(raiz.izquierda, valor)
        elif valor > raiz.valor:
            raiz.derecha = self._insertar_recursivo(raiz.derecha, valor)
        return raiz

    def buscar(self, valor):
        return self._buscar_recursivo(self.raiz, valor)

    def _buscar_recursivo(self, raiz, valor):
        if raiz is None or raiz.valor == valor:
            return raiz
        if valor < raiz.valor:
            return self._buscar_recursivo(raiz.izquierda, valor)
        return self._buscar_recursivo(raiz.derecha, valor)

    def eliminar(self, valor):
        self.raiz = self._eliminar_recursivo(self.raiz, valor)

    def _eliminar_recursivo(self, raiz, valor):
        if raiz is None:
            return raiz
        if valor < raiz.valor:
            raiz.izquierda = self._eliminar_recursivo(raiz.izquierda, valor)
        elif valor > raiz.valor:
            raiz.derecha = self._eliminar_recursivo(raiz.derecha, valor)
        else:
            if raiz.izquierda is None:
                return raiz.derecha
            elif raiz.derecha is None:
                return raiz.izquierda
            raiz.valor = self._encontrar_minimo(raiz.derecha)
            raiz.derecha = self._eliminar_recursivo(raiz.derecha, raiz.valor)
        return raiz

    def _encontrar_minimo(self, raiz):
        minimo = raiz.valor
        while raiz.izquierda is not None:
            minimo = raiz.izquierda.valor
            raiz = raiz.izquierda
        return minimo

    def cargar_desde_archivo(self, ruta_archivo):
        if not os.path.exists(ruta_archivo):
            print("El archivo no existe.")
            return
        with open(ruta_archivo, 'r') as archivo:
            numeros = archivo.read().splitlines()
            for numero in numeros:
                self.insertar(int(numero))

    def a_graphviz(self):
        if self.raiz is None:
            return None
        dot = graphviz.Digraph()
        self._generar_graphviz(self.raiz, dot)
        return dot

    def _generar_graphviz(self, raiz, dot):
        if raiz is not None:
            dot.node(str(raiz.valor))
            if raiz.izquierda is not None:
                dot.edge(str(raiz.valor), str(raiz.izquierda.valor))
                self._generar_graphviz(raiz.izquierda, dot)
            if raiz.derecha is not None:
                dot.edge(str(raiz.valor), str(raiz.derecha.valor))
                self._generar_graphviz(raiz.derecha, dot)

def menu():
    print("\n--- Árbol Binario de Búsqueda ---")
    print("1. Insertar")
    print("2. Buscar")
    print("3. Eliminar")
    print("4. Cargar desde Archivo")
    print("5. Convertir a Graphviz")
    print("6. Salir")

def main():
    arbol = ArbolBinarioBusqueda()
    while True:
        menu()
        opcion = input("Seleccione una opción: ")
        if opcion == '1':
            valor = int(input("Ingrese el valor a insertar: "))
            arbol.insertar(valor)
        elif opcion == '2':
            valor = int(input("Ingrese el valor a buscar: "))
            nodo = arbol.buscar(valor)
            if nodo is not None:
                print("El valor está en el árbol.")
            else:
                print("El valor no está en el árbol.")
        elif opcion == '3':
            valor = int(input("Ingrese el valor a eliminar: "))
            arbol.eliminar(valor)
        elif opcion == '4':
            ruta_archivo = input("Ingrese la ruta del archivo: ")
            arbol.cargar_desde_archivo(ruta_archivo)
        elif opcion == '5':
            dot = arbol.a_graphviz()
            if dot is not None:
                dot.render('arbol_binario', format='png', cleanup=True)
                print("Árbol Binario generado en arbol_binario.png")
            else:
                print("El árbol está vacío.")
        elif opcion == '6':
            print("Saliendo del programa...")
            break
        else:
            print("Opción inválida. Por favor, seleccione una opción válida.")

if __name__ == "__main__":
    main()
